import React, { useState } from "react";
import { 
  Star, MessageCircle, Bug, Lightbulb, ThumbsUp, Send, ArrowLeft, X, Upload
} from "lucide-react";
import "./Feedback.css";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from '../components/ToastContext';

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("general");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [contactAllowed, setContactAllowed] = useState(true);
  const { show } = useToast();

  const feedbackTypes = [
    { id: "general", label: "General Feedback", icon: <MessageCircle size={18} /> },
    { id: "bug", label: "Bug Report", icon: <Bug size={18} /> },
    { id: "suggestion", label: "Feature Suggestion", icon: <Lightbulb size={18} /> },
    { id: "praise", label: "Praise", icon: <ThumbsUp size={18} /> }
  ];

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !message.trim()) {
      show("Please provide both a rating and a message.", { type: "error" });
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      const feedbackData = {
        rating,
        message,
        type: feedbackType,
        contactAllowed,
        createdAt: serverTimestamp(),
        userId: user ? user.uid : null,
        email: user ? user.email : "Anonymous",
        userAgent: navigator.userAgent,
        page: window.location.pathname,
      };

      // In a real app, you would upload the screenshot to storage
      // and add the URL to feedbackData
      
      await addDoc(collection(db, "feedback"), feedbackData);

      setSubmitted(true);
      setRating(0);
      setMessage("");
      setFeedbackType("general");
      setScreenshot(null);
      setContactAllowed(true);
      
      show("Thank you for your feedback!", { type: "success" });
    } catch (err) {
      console.error("Error saving feedback:", err);
      show("Something went wrong. Please try again.", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-success">
        <div className="success-icon">🎉</div>
        <h2>Thank you for your feedback!</h2>
        <p>Your input helps us improve the app for everyone.</p>
        <div className="success-actions">
          <button 
            className="btn-primary" 
            onClick={() => setSubmitted(false)}
          >
            <Send size={16} />
            Send another feedback
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} />
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <div className="feedback-header">
          <h1>Share Your Feedback</h1>
          <p>We're all ears! Tell us about your experience with Orion</p>
        </div>

        <form className="feedback-form" onSubmit={handleSubmit}>
          {/* Feedback Type Selection */}
          <div className="form-section">
            <label>What type of feedback are you sharing?</label>
            <div className="feedback-type-selector">
              {feedbackTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`feedback-type-btn ${feedbackType === type.id ? 'active' : ''}`}
                  onClick={() => setFeedbackType(type.id)}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="form-section">
            <label>How would you rate your experience?</label>
            <div className="rating-container">
              {[...Array(5)].map((_, index) => {
                const value = index + 1;
                return (
                  <button
                    type="button"
                    key={value}
                    className={`rating-star ${value <= (hover || rating) ? "active" : ""}`}
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`Rate ${value} out of 5 stars`}
                  >
                    <Star 
                      size={32} 
                      fill={value <= (hover || rating) ? "currentColor" : "none"} 
                    />
                  </button>
                );
              })}
            </div>
            <div className="rating-labels">
              <span>Not satisfied</span>
              <span>Very satisfied</span>
            </div>
          </div>

          {/* Message */}
          <div className="form-section">
            <label htmlFor="feedback-message">
              {feedbackType === 'bug' ? 'Describe the bug you encountered' :
               feedbackType === 'suggestion' ? 'Tell us about your idea' :
               feedbackType === 'praise' ? 'What did you love about Orion?' :
               'Share your thoughts with us'}
            </label>
            <textarea
              id="feedback-message"
              placeholder={
                feedbackType === 'bug' ? 'Please include steps to reproduce the issue...' :
                feedbackType === 'suggestion' ? 'How would this feature improve your experience?' :
                feedbackType === 'praise' ? 'We love hearing what works well!' :
                'What did you like? What can we improve?'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="5"
            />
          </div>

          {/* Screenshot Upload */}
          {feedbackType === 'bug' && (
            <div className="form-section">
              <label htmlFor="screenshot-upload">Add a screenshot (optional)</label>
              <div className="screenshot-upload">
                <input
                  type="file"
                  id="screenshot-upload"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="file-input"
                />
                <label htmlFor="screenshot-upload" className="file-input-label">
                  <Upload size={18} />
                  Choose file
                </label>
                {screenshot && (
                  <div className="screenshot-preview">
                    <span>{screenshot.name}</span>
                    <button 
                      type="button" 
                      onClick={removeScreenshot}
                      className="remove-screenshot"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Permission */}
          <div className="form-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={contactAllowed}
                onChange={(e) => setContactAllowed(e.target.checked)}
              />
              <span className="checkmark"></span>
              It's okay to contact me about this feedback
            </label>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="feedback-submit-btn"
            disabled={loading || !rating || !message.trim()}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Feedback
              </>
            )}
          </button>
        </form>

        {/* Additional Help Options */}
        <div className="feedback-footer">
          <p>Need immediate help?</p>
          <div className="help-options">
            <a href="/help" className="help-link">Visit Help Center</a>
            <span className="separator">•</span>
            <a href="mailto:support@orionapp.com" className="help-link">Email Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}