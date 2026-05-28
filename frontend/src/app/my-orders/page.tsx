'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/utils/axios';

const OrderSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between gap-4">
            <div className="space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2 sm:text-right">
                <div className="h-3 w-24 bg-gray-200 rounded ml-auto"></div>
                <div className="h-4 w-28 bg-gray-200 rounded ml-auto"></div>
            </div>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-32 h-32 bg-gray-200 rounded-xl"></div>
            <div className="flex-1 space-y-4">
                <div className="flex justify-between">
                    <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
                    <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    </div>
);

export default function MyOrders() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [cancelModalOrder, setCancelModalOrder] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('');

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders/myorders');
            if (Array.isArray(data)) {
                setOrders(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            router.push('/login');
            return;
        }
        fetchOrders();
    }, [token, router]);

    const handleCancelOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancelModalOrder || !cancelReason.trim()) return;
        
        setCancelling(cancelModalOrder._id);
        try {
            const response = await api.post('/orders/cancel-order', { 
                orderId: cancelModalOrder._id, 
                reason: cancelReason 
            });
            alert(response.data.msg || 'Order cancelled successfully');
            setCancelModalOrder(null);
            setCancelReason('');
            await fetchOrders(); // Refresh the list
            if (selectedOrder?._id === cancelModalOrder._id) setSelectedOrder(null);
        } catch (err: any) {
            console.error('Cancel Error:', err);
            const errorMessage = err.response?.data?.msg || err.message || 'Failed to cancel order';
            alert(`Error: ${errorMessage}`);
        } finally {
            setCancelling(null);
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to remove this order from your history? This action cannot be undone.')) return;
        
        try {
            await api.delete(`/orders/${orderId}`);
            alert('Order removed from history successfully');
            await fetchOrders(); // Refresh the list
        } catch (err: any) {
            alert(err.response?.data?.msg || 'Failed to remove order');
        }
    };

    if (!user && !loading) return null;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Orders</h1>
                        <p className="text-gray-500 mt-2 text-lg">Track and manage your artisan discoveries</p>
                    </div>
                    {!loading && orders.length > 0 && (
                        <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-sm font-medium text-gray-600">
                            Total Orders: <span className="text-gray-900 font-bold">{orders.length}</span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center max-w-2xl mx-auto">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">No orders yet</h2>
                        <p className="text-gray-500 mb-8 text-lg">Looks like you haven't explored our collection yet. Start your heritage journey today!</p>
                        <Link href="/products" className="inline-block bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gray-200">
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {orders.map((order: any) => (
                            <div key={order._id} className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-100 transition-all duration-300">
                                <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between gap-6">
                                    <div className="grid grid-cols-2 sm:flex sm:gap-12 gap-4">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Date</p>
                                            <p className="font-bold text-gray-900 text-sm">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total</p>
                                            <p className="font-bold text-gray-900 text-sm">₹{((order.product?.productPrice || 0) * order.quantity).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="hidden lg:block">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Ship to</p>
                                            <p className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{order.address?.shippingAddress.split(',')[0]}</p>
                                        </div>
                                    </div>
                                    <div className="sm:text-right">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Order #</p>
                                        <p className="font-mono text-[10px] text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full inline-block">
                                            {order._id.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="p-8 flex flex-col md:flex-row gap-8">
                                    <div 
                                        onClick={() => setPreviewImage(order.product?.image)}
                                        className="relative w-full md:w-40 h-40 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 group-hover:shadow-md transition-shadow duration-300 cursor-zoom-in"
                                    >
                                        {order.product?.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={order.product.image} alt={order.product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                                            Qty: {order.quantity}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors duration-300">
                                                    {order.product?.title || 'Heritage Product'}
                                                </h3>
                                                <p className="text-gray-400 text-sm mt-1 line-clamp-1">{order.product?.description}</p>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                                                order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                                'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-auto grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                                            <div>
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Shipping Details</h4>
                                                <p className="text-gray-600 text-sm leading-relaxed">{order.address?.shippingAddress}</p>
                                            </div>
                                            <div className="flex items-end justify-start md:justify-end gap-3">
                                                {['Pending', 'Paid'].includes(order.status) && (
                                                    <button 
                                                        onClick={() => setCancelModalOrder(order)}
                                                        className="px-5 py-2.5 rounded-xl border border-red-100 text-red-600 text-sm font-bold hover:bg-red-50 transition-colors"
                                                    >
                                                        Cancel Order
                                                    </button>
                                                )}
                                                {order.status === 'Cancelled' && (
                                                    <button 
                                                        onClick={() => handleDeleteOrder(order._id)}
                                                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 transition-colors"
                                                    >
                                                        Remove from History
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200"
                                                >
                                                    Order Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cancellation Reason Modal */}
            {cancelModalOrder && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-red-50/50">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Cancel Order?</h2>
                                <p className="text-xs text-red-500 font-bold mt-1 tracking-tight">Please tell us why you are cancelling</p>
                            </div>
                            <button 
                                onClick={() => { setCancelModalOrder(null); setCancelReason(''); }}
                                className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCancelOrder} className="p-8">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Reason for cancellation</label>
                                <textarea 
                                    required
                                    rows={4}
                                    placeholder="e.g. Changed my mind, Ordered by mistake, Found a better price..."
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none resize-none text-sm"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => { setCancelModalOrder(null); setCancelReason(''); }}
                                    className="flex-1 px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Go Back
                                </button>
                                <button 
                                    type="submit"
                                    disabled={cancelling === cancelModalOrder._id || !cancelReason.trim()}
                                    className="flex-2 px-6 py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100 disabled:opacity-50"
                                >
                                    {cancelling === cancelModalOrder._id ? 'Processing...' : 'Confirm Cancellation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Order Details</h2>
                                <p className="text-xs text-gray-400 font-mono mt-1 tracking-tighter">#{selectedOrder._id.toUpperCase()}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto max-h-[70vh]">
                            <div className="grid md:grid-cols-2 gap-10">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Product Info</h3>
                                    <div className="flex gap-4">
                                        <div 
                                            onClick={() => setPreviewImage(selectedOrder.product?.image)}
                                            className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity"
                                        >
                                            <img src={selectedOrder.product?.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{selectedOrder.product?.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">Qty: {selectedOrder.quantity}</p>
                                            <p className="text-sm font-bold text-[var(--color-primary)] mt-2">₹{selectedOrder.product?.productPrice?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Order Status</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                                selectedOrder.status === 'Delivered' ? 'bg-emerald-500' :
                                                selectedOrder.status === 'Shipped' ? 'bg-blue-500' : 
                                                selectedOrder.status === 'Cancelled' ? 'bg-red-500' :
                                                'bg-amber-500'
                                            } ${selectedOrder.status !== 'Cancelled' ? 'animate-pulse' : ''}`}></div>
                                            <p className="font-bold text-gray-900">{selectedOrder.status}</p>
                                        </div>
                                        {selectedOrder.status === 'Cancelled' && selectedOrder.cancellationReason && (
                                            <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Reason for cancellation</p>
                                                <p className="text-xs text-red-600 italic">"{selectedOrder.cancellationReason}"</p>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            Your order was placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { dateStyle: 'full' })}.
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="md:col-span-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Shipping Information</h3>
                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                                                <p className="text-sm font-bold text-gray-900">{selectedOrder.address?.fullName || user.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact</p>
                                                <p className="text-sm font-bold text-gray-900">{selectedOrder.address?.phone || 'N/A'}</p>
                                                <p className="text-[10px] text-gray-500">{selectedOrder.address?.email || user.email}</p>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Address</p>
                                                <p className="text-sm font-medium text-gray-600 leading-relaxed">{selectedOrder.address?.shippingAddress}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                                        <p className="text-sm font-bold text-gray-900">{selectedOrder.razorpayPaymentId ? 'Online Payment' : 'Cash on Delivery'}</p>
                                    </div>
                                    {['Pending', 'Paid'].includes(selectedOrder.status) && (
                                        <button 
                                            onClick={() => { setSelectedOrder(null); setCancelModalOrder(selectedOrder); }}
                                            className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors self-center"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                    {selectedOrder.status === 'Cancelled' && (
                                        <button 
                                            onClick={() => { handleDeleteOrder(selectedOrder._id); setSelectedOrder(null); }}
                                            className="px-4 py-2 rounded-xl bg-gray-50 text-gray-500 text-xs font-bold hover:bg-gray-100 transition-colors self-center"
                                        >
                                            Remove Order
                                        </button>
                                    )}
                                </div>
                                <div className="text-center sm:text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                                    <p className="text-3xl font-black text-gray-900">₹{((selectedOrder.product?.productPrice || 0) * selectedOrder.quantity).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Image Preview */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 cursor-zoom-out"
                    onClick={() => setPreviewImage(null)}
                >
                    <button 
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                        onClick={() => setPreviewImage(null)}
                    >
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="max-w-[90vw] max-h-[90vh] relative group" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={previewImage} 
                            alt="Preview" 
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500" 
                        />
                        <div className="absolute inset-x-0 -bottom-12 text-center text-white/70 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            Click anywhere to close
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



