# Invisible Disability Mapper

*An accessibility-focused web app empowering neurodivergent individuals—and anyone who benefits from sensory-aware spaces—to navigate public environments with confidence and ease.*

🌐 **[Try the Live Application](https://invisible-disability-mapper.vercel.app)** 🌐

## Project Overview

I created Invisible Disability Mapper to help people with invisible disabilities make informed decisions about where to go. Navigating public spaces can be challenging due to factors like sensory overload, social challenges, and fatigue management. This app helps address those issues by using community-driven insights, empowering users to approach environments with confidence and support.

This project combines interactive mapping technology with user-generated accessibility reviews, specifically designed with neurodivergent-friendly and sensory aware UI principles in mind.

## Key Features

### Neurodivergent-Friendly Design
- **Calming color palette**: Sage green theme (#9CAF88) to create a calm UI.
- **Clear navigation**: Simple, intuitive interface 
- **Accessible typography**: Courier New font for improved readability
- **Gentle gradients**: Subtle visual elements that enhance interface without extra distraction

### Sensory Challenge Rating System
I implemented **7 specialized sliders** that matter most to neurodivergent individuals:
- **Sensory Overload** (1-5): How manageable sensory input is (e.g. lights, sounds, smells). Higher scores indicate a calmer, more comfortable environment.
- **Cognitive and Mental Fatigue** (1-5): How mentally demanding an environment is. Higher scores would indicate lower fatigue and easier cognitive processing. 
- **Pain and Physical Limitations** (1-5): Degree to which physical barriers or discomfort affect the accessibility of a location. Higher scores indicate that a space is easier to navigate physically.
- **Social Challenges** (1-5): Levels of social interaction required. Higher scores indicate more calm and supportive social environments.
- **Emotional/Mental Health** (1-5): How the environment affects stress, anxiety, or emotional well-being. Higher scores mean a more supportive experience.
- **Healthcare and Accommodation** (1-5): Availability of accommodations, support staff, or resources. Higher scores indicate better access and support.
- **Fatigue Management** (1-5): How easily users can rest, pace themselves, and manage energy in the location. Higher scores would indicate better fatigue management.

### Interactive Mapping
- **Real-time location search** using Geoapify API
- **Visual markers** distinguishing between places and user reviews
- **Clustered display** to prevent visual overwhelm
- **Click-to-select** locations for easy review submission

### Community-Driven Reviews
- **Location-based reviews** with detailed sensory information
- **Personal comments** section for specific tips and experiences
- **Filter system** to find reviews by location or challenge type
- **Privacy-focused** - no personal information required

## Tech Stack

**Frontend:**
- HTML5 with semantic accessibility features
- Custom CSS with neurodivergent-friendly design principles
- JavaScript (ES6+) for interactive functionality
- Bootstrap 5 for responsive layout
- Leaflet.js for interactive mapping

**Backend:**
- Node.js with Express.js server
- RESTful API design
- JSON file storage (easily upgradeable to database)
- Environment-based configuration

**External APIs:**
- Geoapify for geocoding and place search
- OpenStreetMap for map tiles

## Screenshots

| Main Interface | Review Form | Challenge Sliders |
|---|---|---|
| ![Main Interface](assets/Screenshot%202025-10-29%206.36.52%20PM.png) | ![Review Form](assets/Screenshot%202025-10-29%206.37.17%20PM.png) | ![Challenge Sliders](assets/Screenshot%202025-10-29%206.37.23%20PM.png) |

| Review Filter | Places Search | Location Selection |
|---|---|---|
| ![Review Filter](assets/Screenshot%202025-10-29%206.37.33%20PM.png) | ![Places Search](assets/Screenshot%202025-10-29%206.37.54%20PM.png) | ![Location Selection](assets/Screenshot%202025-10-29%206.38.48%20PM.png) |

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- A Geoapify API key ([get one free here](https://www.geoapify.com/))

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/turtllee59/invisible-disability-mapper.git
   cd invisible-disability-mapper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Geoapify API key:
   # GEOAPIFY_KEY=your-actual-api-key-here
   ```

4. **Start the server**
   ```bash
   node server.js
   ```

5. **Open your browser** to `http://localhost:3000`

## How to Use

1. **Explore the map** - Default view shows College Park, MD area
2. **Search for places** - Use the sidebar to search by location and category
3. **Click to select** - Choose locations from the map or search results
4. **Submit reviews** - Rate places using our 7-point accessibility system
5. **Browse past reviews** - Filter and explore community feedback
6. **Find accessible spaces** - Use reviews to make informed decisions

## 🎓 Development Notes

This project was developed as part of my computer science coursework, with a focus on:
- **Inclusive design principles** for neurodivergent users
- **API integration** and real-time data handling
- **Responsive web development** best practices
- **User experience research** in accessibility space

*I received assistance from GitHub Copilot for certain coding challenges, particularly around API integration and responsive design implementation, but the baseline code, core concept, accessibility focus, and user experience design were entirely my own.*

## Why This Matters

Traditional accessibility resources often overlook the needs of people with invisible disabilities. This application addresses:

- **Sensory processing differences** common in autism and ADHD
- **Social anxiety** considerations for neurodivergent individuals
- **Predictability needs** that help reduce stress and meltdowns
- **Community knowledge sharing** among people with similar challenges

## Future Enhancements

- [ ] Database integration for scalability
- [ ] User accounts with personal preferences
- [ ] Mobile app development
- [ ] Integration with existing accessibility platforms
- [ ] AI-powered recommendation system
- [ ] Multilingual support

## License

MIT License - See LICENSE file for details

## Contributing

This project is open to contributions, especially from individuals who can provide insights into accessibility needs. Please feel free to submit issues or pull requests!

---

*Built with love for the neurodivergent community*