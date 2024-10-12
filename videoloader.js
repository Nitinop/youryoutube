class VideoLoader {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        throw new Error(`Container with id "${containerId}" not found`);
      }
  
      this.config = {
        videoEndpoint: options.videoEndpoint || 'videos.json',
        thumbnailQuality: options.thumbnailQuality || 'mqdefault',
        playerPage: options.playerPage || 'video-player.html',
        errorRetries: options.errorRetries || 3
      };
  
      // Define constant videos that will always be shown
      this.constantVideos = [
        {
          id: 'vid.mp4',
          title: 'Angel!?',
          thumbnail: 'th1.jpg',
          duration: '3:32',
          views: 1234567,
          uploadDate: '2024-10-12',
          author: {
            name: 'Featured Angel',
            avatar: 'profile.jpg'
          }
        },
        {
          id: 'vid2.mp4',
          title: 'Do not beat me for this',
          thumbnail: 'th3.jpeg',
          duration: '0:18',
          views: 891011,
          uploadDate: '2024-10-12',
          author: {
            name: 'Featured chudail',
            avatar: 'profile.jpg'
          }
        }
      ];
  
      this.videosData = [];
      this.isLoading = false;
      this.isYouTubeVideo = (videoId) => videoId.length === 11 && !videoId.includes('.');
    
    }
  
    initialize() {
      // Render constant videos first
      this.renderConstantVideos();
      // Then load dynamic videos
      this.loadVideos();
    }
  
    renderConstantVideos() {
      this.container.innerHTML = ''; // Clear container
      
      // Create and append constant videos
      this.constantVideos.forEach(video => {
        const videoElement = this.createVideoElement(video);
        videoElement.classList.add('featured-video');
        this.container.appendChild(videoElement);
      });
    }
  
    createVideoElement(video) {
      const wrapper = document.createElement('div');
      wrapper.className = 'video';

      const isYouTube = this.isYouTubeVideo(video.id);
      const encodedTitle = encodeURIComponent(video.title);
      const playerUrl = `${this.config.playerPage}?v=${video.id}&title=${encodedTitle}&type=${isYouTube ? 'youtube' : 'local'}`;
      const views = this.formatViews(video.views);
      const timeAgo = this.getTimeAgo(video.uploadDate);
      const safeTitle = this.escapeHtml(video.title);
      const safeAuthorName = this.escapeHtml(video.author.name);

      wrapper.innerHTML = `
          <div class="video_thumbnail">
              <a href="${playerUrl}">
                  <img 
                      src="${video.thumbnail}" 
                      alt="${safeTitle}"
                      loading="lazy"
                  >
                  ${video.duration ? `<span class="duration">${video.duration}</span>` : ''}
              </a>
          </div>
          <div class="video_details">
              <div class="author">
                  <img 
                      src="${video.author.avatar}" 
                      alt="${safeAuthorName}"
                      loading="lazy"
                  >
              </div>
              <div class="title">
                  <h3>${safeTitle}</h3>
                  <a href="#" class="author-name">${safeAuthorName}</a>
                  <span>${views} • ${timeAgo}</span>
              </div>
          </div>
      `;

      this.attachEventListeners(wrapper, video);
      return wrapper;
  }
  
    async loadVideos(retryCount = 0) {
      if (this.isLoading) return;
      this.isLoading = true;
  
      try {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading';
        loadingElement.textContent = 'Loading videos...';
        this.container.appendChild(loadingElement);
  
        const response = await fetch(this.config.videoEndpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        this.videosData = data.videos.map(video => ({
          ...video,
          id: this.getVideoId(video.id),
          thumbnail: video.thumbnail || this.generateThumbnailUrl(video.id)
        }));
        
        this.renderDynamicVideos();
      } catch (error) {
        console.error('Error loading videos:', error);
        
        if (retryCount < this.config.errorRetries) {
          console.log(`Retrying... Attempt ${retryCount + 1} of ${this.config.errorRetries}`);
          setTimeout(() => this.loadVideos(retryCount + 1), 1000 * (retryCount + 1));
        } else {
          this.handleError('Failed to load videos after multiple attempts');
        }
      } finally {
        this.isLoading = false;
      }
    }
  
    renderDynamicVideos() {
      // Remove loading element if it exists
      const loadingElement = this.container.querySelector('.loading');
      if (loadingElement) {
        loadingElement.remove();
      }
  
      // Append dynamic videos
      this.videosData.forEach(video => {
        const videoElement = this.createVideoElement(video);
        this.container.appendChild(videoElement);
      });
    }
  
    handleError(message) {
      const errorElement = document.createElement('div');
      errorElement.className = 'error';
      errorElement.innerHTML = `
        <p>${message}</p>
        <button onclick="this.loadVideos()">Try Again</button>
      `;
      this.container.appendChild(errorElement);
    }
  
    formatViews(views) {
      if (views >= 1000000) {
        return `${(views / 1000000).toFixed(1)}M views`;
      } else if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}K views`;
      }
      return `${views} views`;
    }
  
    escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  
    getTimeAgo(dateString) {
      const uploadDate = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - uploadDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
      if (diffDays < 30) {
        return `${diffDays} days ago`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years} year${years > 1 ? 's' : ''} ago`;
      }
    }
  
    getVideoId(url) {
      if (!url) return null;
      if (url.length === 11) return url;
  
      const patterns = {
        standard: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        shortUrl: /youtu\.be\/([^&\n?#]+)/,
        embed: /youtube\.com\/embed\/([^&\n?#]+)/
      };
  
      for (const pattern of Object.values(patterns)) {
        const match = url.match(pattern);
        if (match?.[1]) return match[1];
      }
  
      return null;
    }
  
    generateThumbnailUrl(videoId) {
      const id = this.getVideoId(videoId);
      if (!id) throw new Error('Invalid video ID');
      return `https://img.youtube.com/vi/${id}/${this.config.thumbnailQuality}.jpg`;
    }
  
    attachEventListeners(element, video) {
      const thumbnailLink = element.querySelector('.video_thumbnail a');
      thumbnailLink?.addEventListener('click', (e) => {
        this.handleVideoClick(e, video);
      });
  
      const authorLink = element.querySelector('.author-name');
      authorLink?.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAuthorClick(video.author);
      });
    }
  
    handleVideoClick(e, video) {
      console.log('Video clicked:', video.title);
    }
  
    handleAuthorClick(author) {
      console.log('Author clicked:', author.name);
    }
  }
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const videoLoader = new VideoLoader('videosContainer', {
      videoEndpoint: 'videos.json',
      thumbnailQuality: 'hqdefault',
      errorRetries: 3
    });
    
    videoLoader.initialize();
  });