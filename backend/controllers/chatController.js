const { Configuration, OpenAIApi } = require('openai');
const Chat = require('../models/Chat');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// @desc    Get chat history
// @route   GET /api/chat/history
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .sort({ 'messages.timestamp': -1 });
    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send message to ChatGPT
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Please add a message' });
    }

    // Get or create chat history for user
    let chat = await Chat.findOne({ userId: req.user._id });
    
    if (!chat) {
      chat = await Chat.create({
        userId: req.user._id,
        messages: [],
      });
    }

    // Add user message to chat history
    chat.messages.push({
      role: 'user',
      content: message,
    });

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ],
    });

    const aiResponse = completion.data.choices[0].message.content;

    // Add AI response to chat history
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
    });

    // Save updated chat history
    await chat.save();

    res.json({
      message: aiResponse,
      chatHistory: chat.messages,
    });
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error);
    res.status(500).json({ 
      message: 'Error processing your request',
      error: error.response ? error.response.data : error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
};
