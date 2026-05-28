const HeritageSite = require('../models/HeritageSite');
const Artisan = require('../models/Artisan');
const User = require('../models/User');
const Order = require('../models/Order');
const Event = require('../models/Event');

exports.getDashboardStats = async (req, res) => {
    try {
        const sitesCount = await HeritageSite.countDocuments();
        const artisansCount = await Artisan.countDocuments();

        const statesData = await HeritageSite.distinct('state');
        const statesCovered = statesData.length;

        // Dummy logic for Annual Visitors summing up
        const sites = await HeritageSite.find();
        const annualVisitors = sites.reduce((acc, site) => acc + (site.annualVisitors || 0), 0);

        // Economic Impact (dummy calculation for now)
        const tourismRevenue = annualVisitors * 50;
        const artisanRevenue = artisansCount * 10000;
        const totalEconomicImpact = tourismRevenue + artisanRevenue;

        // New Visitor Trends (simulated data for Day, Week, Month, Year)
        const visitorTrends = {
            Day: {
                labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
                datasets: [
                    { label: 'Direct login', data: [50, 120, 200, 180, 250, 150] },
                    { label: 'Links to sites', data: [30, 80, 150, 130, 190, 110] }
                ]
            },
            Week: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    { label: 'Direct login', data: [800, 950, 1100, 1000, 1200, 1500, 1300] },
                    { label: 'Links to sites', data: [500, 600, 800, 750, 900, 1100, 950] }
                ]
            },
            Month: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [
                    { label: 'Direct login', data: [3500, 4200, 3800, 4500] },
                    { label: 'Links to sites', data: [2200, 2800, 2500, 3100] }
                ]
            },
            Year: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                    { label: 'Direct login', data: [12000, 15000, 18000, 16000, 21000, 25000, 23000, 28000, 32000, 30000, 35000, 40000] },
                    { label: 'Links to sites', data: [8000, 11000, 13000, 12000, 16000, 19000, 17000, 21000, 25000, 23000, 27000, 31000] }
                ]
            }
        };

        // High Sale Products (actual data from approved orders)
        const orderAgg = await Order.aggregate([
            { $match: { status: { $ne: 'Pending' } } },
            { $lookup: {
                from: 'events',
                localField: 'product',
                foreignField: '_id',
                as: 'productDetails'
            }},
            { $unwind: '$productDetails' },
            { $group: {
                _id: '$product',
                name: { $first: '$productDetails.title' },
                amount: { $sum: { $multiply: ['$quantity', '$productDetails.productPrice'] } }
            }},
            { $sort: { amount: -1 } },
            { $limit: 5 }
        ]);

        const colors = ['#f97316', '#ef4444', '#0ea5e9', '#3b82f6', '#22c55e'];
        const highSaleProducts = orderAgg.length > 0 
            ? orderAgg.map((item, index) => ({
                name: item.name,
                amount: item.amount,
                color: colors[index % colors.length]
            }))
            : [
                { name: 'No Sales Yet', amount: 0, color: '#CBD5E1' }
            ];

        const totalSales = highSaleProducts.reduce((acc, p) => acc + p.amount, 0);

        // Recommended Sites (top 3 by views, unique by name)
        const recommendedSites = await HeritageSite.aggregate([
            { $sort: { views: -1 } },
            {
                $group: {
                    _id: "$name",
                    id: { $first: "$_id" },
                    views: { $first: "$views" }
                }
            },
            { $sort: { views: -1 } },
            { $limit: 3 }
        ]);

        const employmentGeneration = {
            labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
            datasets: [
                {
                    label: 'Artisans Employed',
                    data: [120, 250, 400, 650, 950, artisansCount > 950 ? artisansCount : 1200]
                }
            ]
        };

        res.json({
            sitesCount,
            artisansCount,
            statesCovered,
            annualVisitors,
            economicImpact: {
                tourismRevenue,
                artisanRevenue,
                totalEconomicImpact
            },
            visitorTrends,
            highSaleProducts,
            totalSales,
            employmentGeneration,
            recommendedSites: recommendedSites.map(s => ({
                id: s.id,
                name: s._id,
                views: s.views
            }))
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
