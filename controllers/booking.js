const Booking = require('../models/Booking');
const Exhibition = require('../models/Exhibition');
const dayjs = require('dayjs');

// @desc    Get all bookings (admin) or own bookings (member)
// @route   GET /api/v1/booking
// @access  Private (Admin/Member)
exports.getBookings = async (req, res) => {
  try {
    let query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const bookings = await Booking.find(query)
      .populate('exhibition')
      .populate('user', 'name email')
      .sort({ createdAt: -1 }); // Sort by newest first
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single booking
// @route   GET /api/v1/booking/:id
// @access  Private (Admin/Member - own bookings only)
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('exhibition')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking not found with id of ${req.params.id}`
      });
    }

    // Make sure user is booking owner or admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new booking
// @route   POST /api/v1/booking
// @access  Private (Member only)
exports.createBooking = async (req, res) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    // Check if exhibition exists
    const exhibition = await Exhibition.findById(req.body.exhibition);
    if (!exhibition) {
      return res.status(404).json({
        success: false,
        message: `Exhibition not found with id of ${req.body.exhibition}`
      });
    }

    // Check booth type validity
    if (!['small', 'big'].includes(req.body.boothType)) {
      return res.status(400).json({
        success: false,
        message: 'Booth type must be either small or big'
      });
    }

    // Check if start date has not passed
    if (dayjs(exhibition.startDate).isBefore(dayjs(), 'day')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for an exhibition that has already started'
      });
    }

    // Check booth quota
    const availableQuota = req.body.boothType === 'small' ? 
      exhibition.smallBoothQuota : exhibition.bigBoothQuota;

    // Get total booked booths for this booth type
    const bookedBooths = await Booking.aggregate([
      {
        $match: {
          exhibition: exhibition._id,
          boothType: req.body.boothType
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalBooked = bookedBooths.length > 0 ? bookedBooths[0].total : 0;

    if (req.body.amount > availableQuota) {
      return res.status(400).json({
        success: false,
        message: `Not enough ${req.body.boothType} booths available`
      });
    }

    // Check user's total bookings for this exhibition
    const userBookings = await Booking.aggregate([
      {
        $match: {
          user: req.user._id,
          exhibition: exhibition._id
        }
      },
      {
        $group: {
          _id: null,
          totalBooths: { $sum: '$amount' }
        }
      }
    ]);

    const userTotalBooths = userBookings.length > 0 ? userBookings[0].totalBooths : 0;

    if (userTotalBooths + req.body.amount > 6) {
      return res.status(400).json({
        success: false,
        message: 'Total number of booths per exhibition cannot exceed 6'
      });
    }

    // Create booking
    const booking = await Booking.create(req.body);

    // Update exhibition quotas
    if (req.body.boothType === 'small') {
      exhibition.smallBoothQuota -= req.body.amount;
    } else {
      exhibition.bigBoothQuota -= req.body.amount;
    }
    await exhibition.save();

    // Get fully populated booking
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('exhibition');

    res.status(201).json({
      success: true,
      data: populatedBooking
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking request'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete booking
// @route   DELETE /booking/:id
// @access  Private (Admin can delete any, member can only delete their own)
exports.deleteBooking = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Get the exhibition to restore quota
    const exhibition = await Exhibition.findById(booking.exhibition);
    if (exhibition) {
      // Restore quota
      if (booking.boothType === 'small') {
        exhibition.smallBoothQuota += booking.amount;
      } else {
        exhibition.bigBoothQuota += booking.amount;
      }
      await exhibition.save();
    }

    await Booking.deleteOne({ _id: booking._id });

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private (Admin: any booking, Member: own booking)
exports.updateBooking = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check booth type validity
    if (!['small', 'big'].includes(req.body.boothType)) {
      return res.status(400).json({
        success: false,
        message: 'Booth type must be either small or big'
      });
    }

    const exhibition = await Exhibition.findById(booking.exhibition);
    if (!exhibition) {
      return res.status(404).json({
        success: false,
        message: 'Exhibition not found'
      });
    }

    // Get current booth quota based on type
    if (booking.boothType === 'small') {
      exhibition.smallBoothQuota += booking.amount;
    } else {
      exhibition.bigBoothQuota += booking.amount;
    }
    
    // Get the requested changes
    const newBoothType = req.body.boothType || booking.boothType;
    const newAmount = req.body.amount || booking.amount;

    // Check if enough quota is available
    const quotaToCheck = newBoothType === 'small' ? exhibition.smallBoothQuota : exhibition.bigBoothQuota;
    
    if (quotaToCheck < newAmount) {
      return res.status(400).json({
        success: false,
        message: `Not enough ${newBoothType} booths available`
      });
    }

    // Update the quotas
    if (newBoothType === 'small') {
      exhibition.smallBoothQuota -= newAmount;
    } else {
      exhibition.bigBoothQuota -= newAmount;
    }
    await exhibition.save();

    // Update the booking
    booking.amount = newAmount;
    booking.boothType = newBoothType;
    await booking.save();

    // Get fully populated updated booking
    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('exhibition');

    res.json({
      success: true,
      data: updatedBooking
    });
  } catch (error) {
    // If error is from middleware (6 booth limit)
    if (error.message.includes('Total number of booths cannot exceed 6')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
