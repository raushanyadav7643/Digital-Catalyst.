const Order = require('../models/Order');
const Event = require('../models/Event');
const Booking = require('../models/Bookings');
const crypto = require('crypto');
const { sendBookingEmail } = require('../utils/email');

exports.createOrder = async (req, res) => {
    try {
        const { product, quantity, address } = req.body;

        const productDetails = await Event.findById(product); // using Event model because products are saved as Events
        if (!productDetails) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        const price = productDetails.productPrice || productDetails.totalAmount || 1000;
        const amount = Math.round(price * quantity); // COD total

        const newOrder = new Order({
            user: req.user ? req.user.id : undefined,
            product,
            quantity,
            address,
            status: 'Pending'
        });

        await newOrder.save();

        // Immediately create booking since this is COD
        const bookingData = {
            eventId: product,
            status: 'pending', // admin needs to manually confirm
            paymentStatus: 'not_paid', // COD
            amount: amount
        };
        if (req.user) {
            bookingData.userId = req.user.id;
        }
        await Booking.create(bookingData);

        const userEmail = req.user ? req.user.email : address?.email;
        const userName = req.user ? req.user.name : address?.fullName;
        
        if (userEmail) {
            // send email in background to avoid blocking the response
            sendBookingEmail(userEmail, userName || 'Customer', productDetails.title).catch(console.error);
        }

        res.json({
            msg: 'Order created successfully (COD)',
            order: newOrder
        });

    } catch (err) {
        console.error('Error creating order:', err);
        const errorMsg = err.error?.description || err.error?.reason || err.description || err.message || 'Server Error';
        res.status(500).json({ msg: errorMsg });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: 'Paid', razorpayPaymentId: razorpay_payment_id }
            );

            if (order) {
                const event = await Event.findById(order.product);
                const bookingData = {
                    eventId: order.product,
                    status: 'pending', // admin needs to manually confirm
                    paymentStatus: 'paid', // already paid via razorpay
                    amount: event ? event.productPrice * order.quantity : 0
                };
                if (order.user) {
                    bookingData.userId = order.user;
                }
                await Booking.create(bookingData);
            }

            res.status(200).json({ msg: 'Payment verified successfully' });
        } else {
            res.status(400).json({ msg: 'Invalid signature' });
        }
    } catch (err) {
        console.error('Error verifying payment:', err);
        res.status(500).json({ msg: err.description || err.message || 'Server Error' });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).populate('product');
        res.json(orders);
    } catch (err) {
        console.error('Error fetching user orders:', err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        
        console.log(`Cancel request for order: ${orderId} by user: ${req.user?._id}`);
        
        if (!orderId) {
            return res.status(400).json({ msg: 'Order ID is required' });
        }

        // Try to find the order by ID and ensure it belongs to the logged-in user
        const order = await Order.findOne({ 
            _id: orderId, 
            user: req.user._id 
        });
        
        if (!order) {
            console.log(`Order ${orderId} not found for user ${req.user._id}`);
            return res.status(400).json({ msg: 'Order not found or you do not have permission to cancel it' });
        }

        if (['Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
            return res.status(400).json({ msg: `Order cannot be cancelled. Current status: ${order.status}` });
        }

        order.status = 'Cancelled';
        order.cancellationReason = reason || 'No reason provided';
        await order.save();

        res.json({ msg: 'Order has been cancelled successfully', order });
    } catch (err) {
        console.error('Error in cancelOrder:', err);
        res.status(500).json({ msg: 'Internal server error while cancelling order' });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        if (order.status !== 'Cancelled') {
            return res.status(400).json({ msg: 'Only cancelled orders can be removed from history' });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Order removed from history successfully' });
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ msg: 'Internal server error while removing order' });
    }
};
