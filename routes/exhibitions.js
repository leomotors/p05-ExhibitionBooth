const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const exhibitionsController = require("../controllers/exhibitions");

/**
 * @swagger
 * tags:
 *   name: Exhibitions
 *   description: Exhibition management API endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateExhibitionRequest:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - venue
 *         - startDate
 *         - durationDay
 *         - smallBoothQuota
 *         - bigBoothQuota
 *         - posterPicture
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the exhibition
 *         description:
 *           type: string
 *           description: Detailed description of the exhibition
 *         venue:
 *           type: string
 *           description: Location where the exhibition will be held
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of the exhibition (cannot be earlier than current date)
 *         durationDay:
 *           type: integer
 *           minimum: 1
 *           description: Duration of exhibition in days
 *         smallBoothQuota:
 *           type: integer
 *           minimum: 0
 *           description: Number of small booths available
 *         bigBoothQuota:
 *           type: integer
 *           minimum: 0
 *           description: Number of big booths available
 *         posterPicture:
 *           type: string
 *           description: URL of the exhibition poster picture
 *     UpdateExhibitionRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the exhibition
 *         description:
 *           type: string
 *           description: Detailed description of the exhibition
 *         venue:
 *           type: string
 *           description: Location where the exhibition will be held
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of the exhibition (cannot be earlier than current date)
 *         durationDay:
 *           type: integer
 *           minimum: 1
 *           description: Duration of exhibition in days
 *         smallBoothQuota:
 *           type: integer
 *           minimum: 0
 *           description: Number of small booths available
 *         bigBoothQuota:
 *           type: integer
 *           minimum: 0
 *           description: Number of big booths available
 *         posterPicture:
 *           type: string
 *           description: URL of the exhibition poster picture
 *     ExhibitionResponse:
 *       type: object
 *       required:
 *         - _id
 *         - name
 *         - description
 *         - venue
 *         - startDate
 *         - durationDay
 *         - smallBoothQuota
 *         - bigBoothQuota
 *         - posterPicture
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ObjectId
 *           readOnly: true
 *         name:
 *           type: string
 *           description: Name of the exhibition
 *         description:
 *           type: string
 *           description: Detailed description of the exhibition
 *         venue:
 *           type: string
 *           description: Location where the exhibition will be held
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of the exhibition
 *         durationDay:
 *           type: integer
 *           minimum: 1
 *           description: Duration of exhibition in days
 *         smallBoothQuota:
 *           type: integer
 *           minimum: 0
 *           description: Number of small booths available
 *         bigBoothQuota:
 *           type: integer
 *           minimum: 0
 *           description: Number of big booths available
 *         posterPicture:
 *           type: string
 *           description: URL of the exhibition poster picture
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
 *     PopulatedExhibitionResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ExhibitionResponse'
 *         - type: object
 *           required:
 *             - bookings
 *           properties:
 *             bookings:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingResponse'
 *               description: List of bookings associated with this exhibition
 */

/**
 * @swagger
 * /exhibitions:
 *   get:
 *     summary: Get all exhibitions
 *     description: Retrieve all available exhibitions with populated bookings. Accessible by all users.
 *     tags: [Exhibitions]
 *     responses:
 *       200:
 *         description: List of exhibitions
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
 *                     $ref: '#/components/schemas/PopulatedExhibitionResponse'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new exhibition
 *     description: Create a new exhibition. Only accessible by admin users. Start date must not be earlier than current date.
 *     tags: [Exhibitions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateExhibitionRequest'
 *     responses:
 *       201:
 *         description: Exhibition created successfully
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
 *                   $ref: '#/components/schemas/ExhibitionResponse'
 *       400:
 *         description: Invalid input or start date is in the past
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */

/**
 * @swagger
 * /exhibitions/{id}:
 *   get:
 *     summary: Get an exhibition by ID
 *     description: Retrieve details of a specific exhibition with populated bookings. Accessible by all users.
 *     tags: [Exhibitions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exhibition ID
 *     responses:
 *       200:
 *         description: Exhibition details retrieved successfully
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
 *                   $ref: '#/components/schemas/PopulatedExhibitionResponse'
 *       404:
 *         description: Exhibition not found
 *
 *   put:
 *     summary: Update an exhibition
 *     description: Update an existing exhibition. Only accessible by admin users.
 *     tags: [Exhibitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exhibition ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateExhibitionRequest'
 *     responses:
 *       200:
 *         description: Exhibition updated successfully
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
 *                   $ref: '#/components/schemas/ExhibitionResponse'
 *       400:
 *         description: Invalid input or start date is in the past
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Exhibition not found
 *
 *   delete:
 *     summary: Delete an exhibition
 *     description: Delete an exhibition. Only accessible by admin users.
 *     tags: [Exhibitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exhibition ID
 *     responses:
 *       200:
 *         description: Exhibition deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                - success
 *                - message
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Exhibition not found
 */

// Routes for /api/v1/exhibitions
router
  .route("/")
  .get(exhibitionsController.getExhibitions)
  .post(protect, authorize("admin"), exhibitionsController.createExhibition);

router
  .route("/:id")
  .get(exhibitionsController.getExhibition)
  .put(protect, authorize("admin"), exhibitionsController.updateExhibition)
  .delete(protect, authorize("admin"), exhibitionsController.deleteExhibition);

module.exports = router;
