const express = require("express");
const Message = require("../models/Message");
const Appointment = require("../models/Appointment");
const auth = require("../middleware/auth");

const router = express.Router();

// Get messages for a specific appointment
router.get("/appointment/:appointmentId", auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req.user;

    // Verify user has access to this appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.client.toString() !== userId && appointment.counselor.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to access this appointment" });
    }

    // Get messages for this appointment
    const messages = await Message.find({ appointment: appointmentId })
      .populate("sender", "firstName lastName avatar")
      .populate("receiver", "firstName lastName avatar")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send a message
router.post("/", auth, async (req, res) => {
  try {
    const { appointmentId, content, messageType = "text", attachments = [] } = req.body;
    const { userId, userType } = req.user;

    // Verify appointment exists and user has access
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.client.toString() !== userId && appointment.counselor.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to send messages for this appointment" });
    }

    // Determine receiver (if sender is client, receiver is counselor, and vice versa)
    const receiverId = appointment.client.toString() === userId 
      ? appointment.counselor 
      : appointment.client;

    // Create new message
    const message = new Message({
      sender: userId,
      receiver: receiverId,
      appointment: appointmentId,
      content,
      messageType,
      attachments
    });

    await message.save();
    await message.populate("sender", "firstName lastName avatar");
    await message.populate("receiver", "firstName lastName avatar");

    res.status(201).json({
      message: "Message sent successfully",
      data: message
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark messages as read
router.patch("/read", auth, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { userId } = req.user;

    // Mark all unread messages as read for this user in this appointment
    await Message.updateMany(
      { 
        appointment: appointmentId, 
        receiver: userId, 
        isRead: false 
      },
      { isRead: true }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get unread message count for a user
router.get("/unread-count", auth, async (req, res) => {
  try {
    const { userId } = req.user;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
