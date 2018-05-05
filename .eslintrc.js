module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2017,
        "sourceType": "module"
    },
    "rules": {
        "curly": "error",
        "indent": [
            "error",
            4,
            { "SwitchCase": 1 }
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "no-console": [
            "error",
            { "allow": [ "error", "log", "warn" ] }
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};