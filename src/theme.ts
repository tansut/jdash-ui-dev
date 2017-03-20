import { KeyValue } from './core';

export interface ThemeDefinition {
    name: string;
    cssClass: string;
}

export class ThemeManager {
    private static themes: KeyValue<Array<ThemeDefinition>> = {};
    private static currentThemeLibrary: string;
    private static currentTheme: ThemeDefinition;

    static init(name?: string, library?: string) {
        if (this.loadFromLocalstorage()) {
            this.setCurrentTheme(this.currentTheme.name, this.currentThemeLibrary)
        }
        else {
            library = library || 'jdash';
            var themeDefinition = this.themes[library];
            var theme = themeDefinition.filter((item) => item.name == name)[0] || themeDefinition[0];
            this.setCurrentTheme(theme.name, library);
        }
    }

    static loadFromLocalstorage() {
        var savedTheme = localStorage.getItem('j-theme');
        if (savedTheme) {
            var themeData = JSON.parse(savedTheme);
            this.currentThemeLibrary = themeData.library;
            this.currentTheme = themeData.theme;
            return true;
        } else return false;
    }

    static saveToLocalStorage() {
        localStorage.setItem('j-theme', JSON.stringify({
            library: this.currentThemeLibrary,
            theme: this.currentTheme
        }));
    }

    static getThemes(library?: string) {
        library = library || 'jdash';
        return this.themes[library];
    }

    static registerDefinition(library: string, definition: Array<ThemeDefinition>) {
        this.themes[library] = definition;
    }

    static getCurrentTheme() {
        if (this.currentThemeLibrary && this.currentTheme) {
            return {
                library: this.currentThemeLibrary,
                theme: this.currentTheme
            }
        } else return undefined;
    }

    static clearCurrentTheme() {
        var currentTheme = this.getCurrentTheme();
        if (currentTheme) {
            document.body.classList.remove(currentTheme.theme.cssClass);
        }
    }

    static setCurrentTheme(name: string, library?: string) {
        library = library || 'jdash';
        var themeDefinition = this.themes[library];
        var currentTheme = this.getCurrentTheme();
        if (currentTheme)
            this.clearCurrentTheme();
        var theme = themeDefinition.filter((item) => item.name == name)[0];
        if (theme) {
            document.body.classList.add(theme.cssClass);
            this.currentThemeLibrary = library;
            this.currentTheme = theme;
            this.saveToLocalStorage();
        }
    }
}

ThemeManager.registerDefinition('jdash', [
    { cssClass: 'j-theme-jdash', name: 'JDash' },
    { cssClass: 'j-theme-jdash-dark', name: 'JDash Dark' },
    { cssClass: 'j-theme-red', name: 'Red' },
    { cssClass: 'j-theme-green', name: 'Green' },
    { cssClass: 'j-theme-blue', name: 'Blue' },
    { cssClass: 'j-theme-yellow', name: 'Yellow' },
    { cssClass: 'j-theme-black', name: 'Black' },
    { cssClass: 'j-theme-gray', name: 'Gray' }
])


ThemeManager.registerDefinition('bootstrap', [
    { cssClass: 'j-bootstrap-theme-default', name: 'JDash' },
    { cssClass: 'j-bootstrap-theme-dark', name: 'JDash Dark' },
    { cssClass: 'j-bootstrap-theme-red', name: 'Red' },
    { cssClass: 'j-bootstrap-theme-green', name: 'Green' },
    { cssClass: 'j-bootstrap-theme-blue', name: 'Blue' },
    { cssClass: 'j-bootstrap-theme-yellow', name: 'Yellow' },
    { cssClass: 'j-bootstrap-theme-black', name: 'Black' },
    { cssClass: 'j-bootstrap-theme-gray', name: 'Gray' },
    { cssClass: 'j-bootstrap-no-theme', name: 'No Theme' }
])
