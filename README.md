gulp-angular-translate-parse
============================

gulp task to parse for 'translate' attributes and create translations js files

Options
-------
- **moduleName:** _define module name (namespace) for translations. default: 'Translations'_
- **deleteInnerText:** _option to run task in build and remove all text, which is provided by translations. default: false_
- **defaultLang:** _set language for text in html. default. none_
- **preserveWhitespace:** _don't remove extra whitespace, tabs and newlines. default: false._ _**Hint**: with the "gulp-ng-translate-preserve-whitespace" attribute you can preserve whitespace for certain translated html elements_
