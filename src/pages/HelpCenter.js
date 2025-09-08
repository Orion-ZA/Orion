// HelpCenterPage.js
import React, { useState } from 'react';
import { Search, Mail, MessageSquare, 
    BookOpen, Clock, Phone, 
    ArrowRight, ChevronDown, 
    ChevronUp, MapPin, User } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { Link } from 'react-router-dom';
import './HelpCenter.css';
import SettingsIcon from '../components/SettingsIcon';

const HelpCenterPage = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const { show } = useToast();

  const faqCategories = {
    general: {
      title: 'General Questions',
      icon: <BookOpen size={20} />,
      questions: [
        {
          question: 'How do I create an account?',
          answer: 'To create an account, click on the "Log in" button in the top right corner of the homepage. You can sign up using your email address or through Google authentication if don\'t have an account. Once registered, you\'ll have access to all features including saving trails, submitting reviews, and creating wishlists.'
        },
        {
          question: 'Is Orion free to use?',
          answer: 'Yes, Orion is completely free for all users. We believe everyone should have access to quality trail information and outdoor experiences without any cost barriers.'
        },
        {
          question: 'How do I report an issue with a trail?',
          answer: 'You can\'t, buddy !!! But you can send a feedback via profile dropdown menu or maybe we will add buttons to (we don\'t promise) report trail issues by navigating to the trail details page and clicking the "Report Issue" button. Please provide as much detail as possible about the problem (e.g., fallen trees, trail damage, missing markers) so we can address it quickly.'
        }
      ]
    },
    trails: {
      title: 'Trails & Navigation',
      icon: <MapPin size={20} />,
      questions: [
        {
          question: 'How do I save a trail to my wishlist?',
          answer: 'To save a trail to your wishlist, find the trail you\'re interested in either through search or browsing. Click on the heart icon ♥ next to the trail name. You can access your wishlist later from your profile page.'
        },
        {
          question: 'Can I download maps for offline use?',
          answer: 'No, Orion devs haven\'t implemented features that support offline map downloads.'
        },
        {
          question: 'How accurate are the trail difficulty ratings?',
          answer: 'Trust us, bruh. Trail difficulty ratings are based on community feedback and our algorithm that considers elevation gain, terrain type, and distance. However, conditions can change with weather, so always exercise caution and check recent reviews before attempting a trail.'
        }
      ]
    },
    account: {
      title: 'Account & Settings',
      icon: <User size={20} />,
      questions: [
        {
          question: 'How do I reset my password?',
          answer: 'If you\'ve forgotten your password, you need psychiatric help. (free advice; always use Google) Anyway, click "Forgot Password" on the login page. Enter your email address, and we\'ll send you a link to reset your password. The link will expire after 24 hours for security reasons.'
        },
        {
          question: 'Can I change my username?',
          answer: 'Yes, you can change your display name at any time from your profile settings. However, your unique user ID cannot be changed as it\'s used to maintain your hiking history and connections.'
        },
        {
          question: 'How do I delete my account?',
          answer: 'You can\'t. As a matter of fact, if you do this, we will sell your data to big companies 🙂. Orion is free to use, remember? So the cost is your data. haha. I\'m not joking. Account deletion can be done in the privacy section of your settings. Please note that this action is permanent and will \"remove\" all your data, including saved trails, reviews, and hiking history.'
        }
      ]
    },
    technical: {
      title: 'Technical Support',
      icon: <SettingsIcon size={20} />,
      questions: [
        {
          question: 'The app is crashing on my device. What should I do?',
          answer: 'Get a new device, bruh! 😭 First, try closing and reopening the app. If the problem persists, check for updates in your app store as we regularly release bug fixes. If issues continue, contact our support team with details about your device and OS version.'
        },
        {
          question: 'How do I enable notifications?',
          answer: 'Notifications can be enabled in your device settings for the Orion app and customized in the notification section of your profile. We send alerts for trail updates, messages, and recommended hikes based on your preferences.'
        },
        {
          question: 'Why is my location not showing accurately?',
          answer: 'Location accuracy depends on your device\'s GPS signal and settings. Ensure location services are enabled for Orion and try moving to an area with better GPS reception. Using Wi-Fi can also help improve location accuracy.'
        }
      ]
    }
  };

  const toggleItem = (category, index) => {
    setOpenItems(prev => ({
      ...prev,
      [`${category}-${index}`]: !prev[`${category}-${index}`]
    }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // to actualize this, send data to firebase collection under help db or sumn
    show('Your message has been sent to our support team!', { type: 'success' });
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter FAQs based on search query
  const filteredCategories = Object.entries(faqCategories).reduce((acc, [key, category]) => {
    if (searchQuery) {
      const filteredQuestions = category.questions.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (filteredQuestions.length > 0) {
        acc[key] = {
          ...category,
          questions: filteredQuestions
        };
      }
    } else {
      acc[key] = category;
    }
    return acc;
  }, {});

  return (
    <div className="help-center-page">
      <div className="help-center-container">
        {/* Hero Section */}
        <div className="help-hero">
          <h1>How can we help you?</h1>
          <p>Find answers to common questions or contact our support team</p>
          
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Quick Help Cards */}
        <div className="quick-help-section">
          <h2>Get Help Quickly</h2>
          <div className="help-cards">
            <div className="help-card">
              <div className="card-icon">
                <BookOpen size={24} />
              </div>
              <h3>Knowledge Base</h3>
              <p>Browse our comprehensive guides and tutorials</p>
              <button className="card-link">
                <Link to='//www.youtube.com/watch?v=Aq5WXmQQooo'> Explore guides </Link><ArrowRight size={16} />
              </button>
            </div>
            
            <div className="help-card">
              <div className="card-icon">
                <MessageSquare size={24} />
              </div>
              <h3>Community Forum</h3>
              <p>Get answers from other experienced hikers</p>
              <button className="card-link">
                Visit forum <ArrowRight size={16} />
              </button>
            </div>
            
            <div className="help-card">
              <div className="card-icon">
                <Mail size={24} />
              </div>
              <h3>Email Support</h3>
              <p>Contact our support team directly</p>
              <button 
                className="card-link"
                onClick={() => document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' })}
              >
                Send message <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <div className="faq-header">
            <h2>Frequently Asked Questions</h2>
            <p>Browse common questions organized by category</p>
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            {Object.entries(filteredCategories).map(([key, category]) => (
              <button
                key={key}
                className={`category-tab ${activeCategory === key ? 'active' : ''}`}
                onClick={() => setActiveCategory(key)}
              >
                {category.icon}
                {category.title}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="faq-items">
            {filteredCategories[activeCategory]?.questions.map((item, index) => (
              <div key={index} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleItem(activeCategory, index)}
                >
                  <span>{item.question}</span>
                  {openItems[`${activeCategory}-${index}`] ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
                {openItems[`${activeCategory}-${index}`] && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
            
            {filteredCategories[activeCategory]?.questions.length === 0 && (
              <div className="no-results">
                <p>No results found for "{searchQuery}" in this category.</p>
                <button onClick={() => setSearchQuery('')}>Clear search</button>
              </div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div id="contact-section" className="contact-section">
          <div className="contact-content">
            <div className="contact-info">
              <h2>Still need help?</h2>
              <p>Our support team is here to assist you</p>
              
              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4>Email Us</h4>
                    <p>support@orionapp.com</p>
                    <span>Typically replies within 24 hours</span>
                  </div>
                </div>
                
                <div className="contact-method">
                  <div className="method-icon">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h4>Live Chat</h4>
                    <p>Available 9AM-5PM SAST</p>
                    <span>Click the chat icon in the app (to be added)</span>
                  </div>
                </div>
                
                <div className="contact-method">
                  <div className="method-icon">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4>Call Us</h4>
                    <p>+1 (555) 123-4567</p>
                    <span>Mon-Fri, 8AM-6PM PST</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="contact-form-container">
              <h3>Send us a message</h3>
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={contactForm.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleInputChange}
                    rows="5"
                    required
                  ></textarea>
                </div>
                
                <button type="submit" className="submit-button">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;