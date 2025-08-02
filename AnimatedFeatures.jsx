import React, { useState, useEffect, useRef } from "react";

const features = [
  {
    icon: <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    title: "Lightning Fast Performance",
    description: "Optimized algorithms ensure your campaigns execute in milliseconds. Experience the power of real-time automation that keeps your social media presence active and engaging.",
    gradient: "from-blue-500 to-cyan-500",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&crop=center",
    tags: ["Performance", "Speed", "Optimization"]
  },
  {
    icon: <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    title: "Smart Scheduling",
    description: "AI-powered posting times based on audience engagement patterns. Never miss the perfect moment to connect with your audience across Instagram, WhatsApp, and Facebook.",
    gradient: "from-green-500 to-emerald-500",
    image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop&crop=center",
    tags: ["AI", "Scheduling", "Engagement"]
  },
  {
    icon: <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    title: "Campaign Automation",
    description: "Create intelligent workflows that respond to user interactions. Automate responses, nurture leads, and build meaningful connections with your audience effortlessly.",
    gradient: "from-purple-500 to-violet-500",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center",
    tags: ["Automation", "Workflows", "Intelligence"]
  },
  {
    icon: <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    title: "Advanced Analytics",
    description: "Deep insights into your social media performance with AI-driven recommendations. Track growth, engagement, and ROI across all your platforms in real-time.",
    gradient: "from-orange-500 to-red-500",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center",
    tags: ["Analytics", "Insights", "Growth"]
  },
  {
    icon: <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance standards for your data. Your social media accounts and customer information are protected with industry-leading security measures.",
    gradient: "from-red-500 to-pink-500",
    image: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=800&h=600&fit=crop&crop=center",
    tags: ["Security", "Encryption", "Compliance"]
  },
  {
    icon: <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    title: "24/7 Monitoring",
    description: "Continuous monitoring ensures your campaigns run smoothly around the clock. Automatic adjustments and real-time notifications keep you informed and in control.",
    gradient: "from-indigo-500 to-purple-500",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=600&fit=crop&crop=center",
    tags: ["Monitoring", "24/7", "Reliability"]
  },
];

const AnimatedFeatures = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInSection, setIsInSection] = useState(false);

  const containerRef = useRef(null);
  const lastWheelTimeRef = useRef(0);
  const accumulatedDeltaRef = useRef(0);
  const isScrollingRef = useRef(false);

  const smoothScrollTo = (target) => {
    return new Promise((resolve) => {
      const startPosition = window.pageYOffset;
      const distance = target - startPosition;
      const duration = 800;
      let start = null;

      function animation(currentTime) {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
        else resolve();
      }

      function easeInOutCubic(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t * t + b;
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
      }

      requestAnimationFrame(animation);
    });
  };

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToSlide = (index) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
  };

  // Reset animation state
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Auto-advance slides when in section
  useEffect(() => {
    if (!isInSection) return;

    const autoAdvanceTimer = setInterval(() => {
      if (!isAnimating) {
        setCurrentIndex((prev) => (prev + 1) % features.length);
      }
    }, 4000);

    return () => clearInterval(autoAdvanceTimer);
  }, [isInSection, isAnimating]);

  // Main scroll handler
  useEffect(() => {
    const threshold = 50;

    const handleWheel = (e) => {
      const now = Date.now();
      const container = containerRef.current;
      if (!container || isScrollingRef.current) return;

      const containerRect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Check if we're near or in the section
      const nearSection = containerRect.top <= windowHeight * 0.3 && containerRect.bottom >= windowHeight * 0.7;
      const inSection = containerRect.top <= 100 && containerRect.bottom >= 100;

      // If we're approaching the section from above
      if (nearSection && !isInSection && e.deltaY > 0 && containerRect.top > 0) {
        e.preventDefault();
        setIsInSection(true);
        setCurrentIndex(0);
        isScrollingRef.current = true;
        
        smoothScrollTo(container.offsetTop).then(() => {
          isScrollingRef.current = false;
        });
        return;
      }

      // If we're in the section, handle horizontal navigation
      if (inSection && isInSection) {
        e.preventDefault();
        
        // Debounce rapid wheel events
        if (now - lastWheelTimeRef.current < 100) return;
        
        accumulatedDeltaRef.current += e.deltaY;
        
        if (Math.abs(accumulatedDeltaRef.current) >= threshold) {
          if (accumulatedDeltaRef.current > 0) {
            // Scrolling down
            if (currentIndex < features.length - 1) {
              setCurrentIndex(prev => prev + 1);
            } else {
              // Exit to next section
              setIsInSection(false);
              isScrollingRef.current = true;
              smoothScrollTo(container.offsetTop + container.offsetHeight).then(() => {
                isScrollingRef.current = false;
              });
            }
          } else {
            // Scrolling up
            if (currentIndex > 0) {
              setCurrentIndex(prev => prev - 1);
            } else {
              // Exit to previous section
              setIsInSection(false);
              isScrollingRef.current = true;
              smoothScrollTo(container.offsetTop - windowHeight).then(() => {
                isScrollingRef.current = false;
              });
            }
          }
          
          accumulatedDeltaRef.current = 0;
          lastWheelTimeRef.current = now;
        }
        return;
      }

      // If we're approaching from below
      if (nearSection && !isInSection && e.deltaY < 0 && containerRect.bottom < windowHeight) {
        e.preventDefault();
        setIsInSection(true);
        setCurrentIndex(features.length - 1);
        isScrollingRef.current = true;
        
        smoothScrollTo(container.offsetTop).then(() => {
          isScrollingRef.current = false;
        });
        return;
      }
    };

    const handleScroll = () => {
      if (isScrollingRef.current) return;
      
      const container = containerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // More precise section detection
      const inViewport = containerRect.top <= windowHeight * 0.5 && containerRect.bottom >= windowHeight * 0.5;
      
      if (inViewport !== isInSection) {
        setIsInSection(inViewport);
        
        // Reset accumulated delta when entering/leaving
        accumulatedDeltaRef.current = 0;
      }
    };

    // Add event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isInSection, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isInSection) return;
      
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'Escape':
          setIsInSection(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInSection]);

  return (
    <div className="relative">
      {/* Content before carousel */}
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Content Before Carousel</h2>
          <p className="text-xl">Scroll down to enter the features section</p>
          <div className="mt-8 animate-bounce">
            <svg className="w-6 h-6 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Carousel Section */}
      <div ref={containerRef} className="h-screen bg-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Scroll Indicator */}
        <div className={`absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded-lg z-20 transition-opacity duration-300 ${isInSection ? 'opacity-100' : 'opacity-50'}`}>
          {isInSection ? 'Interactive Mode' : 'Scroll Mode'} • {currentIndex + 1}/{features.length}
        </div>

        {/* Instructions */}
        <div className={`absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded-lg z-20 transition-opacity duration-300 ${isInSection ? 'opacity-100' : 'opacity-0'}`}>
          Use arrow keys or scroll to navigate • ESC to exit
        </div>

        {/* Main Content */}
        <div className="h-full flex items-center relative z-10">
          <div className="w-full overflow-hidden">
            <div className="flex transition-transform duration-700 ease-in-out"
                 style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
              {features.map((feature, index) => (
                <div key={index} className="w-full flex-shrink-0 px-6 lg:px-8">
                  <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center h-full min-h-screen">
                      {/* Left Content */}
                      <div className="space-y-12">
                        <div className="space-y-8">
                          <div className="flex items-center space-x-4 mb-6">
                            {feature.icon}
                          </div>
                          <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
                            {feature.title}
                          </h1>
                          <p className="text-2xl text-gray-300 leading-relaxed font-light">
                            {feature.description}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          {feature.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-4 py-2 text-sm font-medium bg-white bg-opacity-5 text-gray-300 rounded-full border border-white border-opacity-10 backdrop-blur-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex space-x-4">
                          <button className={`px-8 py-4 bg-gradient-to-r ${feature.gradient} text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
                            Learn More
                          </button>
                          <button className="px-8 py-4 border border-white border-opacity-20 text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300">
                            Try Demo
                          </button>
                        </div>
                      </div>

                      {/* Right Image */}
                      <div className="relative">
                        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                          <img
                            src={feature.image}
                            alt={feature.title}
                            className="w-full h-[600px] object-cover transition-transform duration-700 hover:scale-105"
                            loading="lazy"
                          />
                          <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradient} opacity-20`}></div>
                          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ${
                index === currentIndex
                  ? 'w-12 h-3 bg-white rounded-full shadow-lg'
                  : 'w-3 h-3 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-full'
              }`}
              disabled={isAnimating}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prevSlide}
          disabled={isAnimating}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed z-20 transition-all duration-200 hover:scale-110 bg-black bg-opacity-30 p-3 rounded-full hover:bg-opacity-50"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={nextSlide}
          disabled={isAnimating}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed z-20 transition-all duration-200 hover:scale-110 bg-black bg-opacity-30 p-3 rounded-full hover:bg-opacity-50"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Progress Bar */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-64 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden z-20">
          <div 
            className="h-full bg-white rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((currentIndex + 1) / features.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content after carousel */}
      <div className="h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Content After Carousel</h2>
          <p className="text-xl">You've completed the features section</p>
          <div className="mt-8">
            <svg className="w-6 h-6 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedFeatures;