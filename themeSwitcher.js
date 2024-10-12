class ThemeSwitcher {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.initializeTheme();
        this.addThemeToggle();
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        this.updateToggleButton();
    }

    addThemeToggle() {
        const headerIcons = document.querySelector('.header__icons');
        const toggleButton = document.createElement('button');
        toggleButton.className = 'theme-toggle';
        this.updateToggleButtonContent(toggleButton);
        
        toggleButton.addEventListener('click', () => {
            this.toggleTheme();
            this.updateToggleButtonContent(toggleButton);
        });

        headerIcons.insertBefore(toggleButton, headerIcons.firstChild);
    }

    updateToggleButtonContent(button) {
        const isDark = this.theme === 'dark';
        button.innerHTML = `
            <i class="material-icons">${isDark ? 'light_mode' : 'dark_mode'}</i>
        `;
    }

    updateToggleButton() {
        const button = document.querySelector('.theme-toggle');
        if (button) {
            this.updateToggleButtonContent(button);
        }
    }
}

// Initialize theme switcher when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeSwitcher();
});