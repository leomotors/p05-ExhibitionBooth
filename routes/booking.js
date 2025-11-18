const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const bookingController = require("../controllers/booking");

/**
 * @swagger
 * /booking:
 *   get:
 *     summary: Get all bookings
 *     description: |
 *       Retrieve bookings based on user role:
 *       - Admin users can view all bookings
 *       - Member users can only view their own bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - count
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     $ref: '#/components/schemas/PopulatedBooking'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server Error
 *
 *   post:
 *     summary: Create a new booking
 *     description: Create a new booth booking for an exhibition (member only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exhibition
 *               - boothType
 *               - amount
 *             properties:
 *               exhibition:
 *                 type: string
 *                 description: ID of the exhibition to book
 *               boothType:
 *                 type: string
 *                 enum: [small, big]
 *                 description: Type of booth (small/big)
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of booths to book (total booths per user per exhibition must not exceed 6)
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PopulatedBooking'
 *       400:
 *         description: Invalid request - Total booths per exhibition must not exceed 6 or quota exceeded
 *       401:
 *         description: Not authorized - Member access required
 *       404:
 *         description: Exhibition not found
 *       500:
 *         description: Server Error
 */

// Get all bookings (admin) or own bookings (member)
router.get("/", protect, bookingController.getBookings);

// Create a new booking (member only)
router.post("/", protect, authorize("member"), bookingController.createBooking);

/**
 * @swagger
 * /booking/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     description: admin can view any booking, member can only view their own
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the booking to view
 *     responses:
 *       200:
 *         description: Returns the booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PopulatedBooking'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *
 *   put:
 *     summary: Update booking
 *     description: admin can update any booking, member can only update their own
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the booking to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               boothType:
 *                 type: string
 *                 enum: [small, big]
 *                 description: Type of booth (small/big)
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of booths (total booths per exhibition must not exceed 6)
 *             required:
 *               - boothType
 *               - amount
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PopulatedBooking'
 *       400:
 *         description: Validation error or booth quota exceeded
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *
 *   delete:
 *     summary: Delete booking
 *     description: admin can delete any booking, member can only delete their own
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the booking to delete
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */

// Get single booking by ID
router.get("/:id", protect, bookingController.getBooking);

// Update a booking (admin can update any, member can only update their own)
router.put("/:id", protect, bookingController.updateBooking);

// Delete a booking (admin can delete any, member can only delete own bookings)
router.delete("/:id", protect, bookingController.deleteBooking);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management API endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BookingResponse:
 *       type: object
 *       required:
 *         - _id
 *         - user
 *         - boothType
 *         - amount
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ObjectId
 *           readOnly: true
 *         user:
 *           type: object
 *           description: Reference to the user who made the booking
 *           readOnly: true
 *           required:
 *             - _id
 *             - name
 *             - email
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         boothType:
 *           type: string
 *           enum: [small, big]
 *           description: Type of booth (small/big)
 *         amount:
 *           type: integer
 *           minimum: 1
 *           description: Number of booths booked (total booths per exhibition must not exceed 6)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Auto-generated timestamp of creation
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Auto-generated timestamp of last update
 *           readOnly: true
 *     PopulatedBooking:
 *       allOf:
 *         - $ref: '#/components/schemas/BookingResponse'
 *         - type: object
 *           required:
 *             - exhibition
 *           properties:
 *             exhibition:
 *               $ref: '#/components/schemas/ExhibitionResponse'
 */
