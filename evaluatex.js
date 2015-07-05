(function() {
    var Evaluatex = {};

    // Private Constants
    // =================
    var UNARY_NODES = ["FUNCTION", "NEGATE"];
    
    // Helpful Objects
    // ===============
    var Token = Evaluatex.Token = function(type, value) {
        if (value === undefined) value = "";

        this.type = type;
        this.value = value;
    };

    var Node = Evaluatex.Node = function(type, value) {
        if (value === undefined) value = "";

        this.type = type;
        this.value = value;
        this.children = [];

        this.add = function(node) { this.children.push(node); };
        this.isUnary = function() { return UNARY_NODES.indexOf(this.type) >= 0;};

        this.printTree = function(level) {
            level = level || 0;

            // Generate the indent string from the current `level`
            var indent = "";
            var iString = "  ";
            for (var i = 0; i < level; i++) {
                indent += "  ";
            };

            console.log(indent + this.type + 
                (this.value ? " " + this.value : "") +
                " (" + this.children.length + ")");
            for (var i in this.children) {
                var child = this.children[i];
                if (child.printTree === undefined) {
                    console.log(indent + iString + child);
                }
                else {
                    this.children[i].printTree(level + 1);
                }
            }
        };

        this.simplify = function() {
            if (this.children.length > 1 || this.isUnary()) {
                var newNode = new Node(this.type, this.value);
                for (i in this.children) {
                    newNode.add(this.children[i].simplify());
                }
                return newNode;
            }
            else if (this.children.length == 1) {
                return this.children[0].simplify();
            }
            else { // No children
                return this;
            }
        };
    };

    // Lexer
    // =====
    var Lexer = Evaluatex.Lexer = function(buffer) {
        this.buffer = buffer;
        this.cursor = 0;
        this.tokenMap = {
            COMMAND: /\\[\w\d]+/,
            FUNCTION: /sin|cos|tan/,
            SYMBOL: /[A-Za-z]+/,
            WS: /\s+/,
            POW: /\^/,
            PM: /[\+\-]/,
            MD: /[\*\/]/,
            EQ: /=/,
            LCURLY: /\{/,
            RCURLY: /\}/,
            LPAREN: /\(/,
            RPAREN: /\)/,
            NUMBER: /\d+(\.\d+)?/
        };
    };

    Lexer.prototype.next = function() {
        // Are we at the end of the buffer?
        if (this.cursor >= this.buffer.length) {
            return null;
        }

        for (k in this.tokenMap) {
            var match = this.tokenMap[k].exec(this.buffer.substring(this.cursor));
            if (match && match.index == 0) {
                this.cursor += match[0].length;
                return new Token(k, match[0]);
            }
        }
        throw "Can't match token at pos " + this.buffer.substring(this.cursor);
    };

    Lexer.prototype.tokens = function() {
        this.tokens = [];
        while (true) {
            var token = this.next();
            if (token != null) {
                this.tokens.push(token);
            }
            else {
                return this.tokens;
            }
        }
    };

    // Parser
    // ======
    Evaluatex.Parser = function(tokens) {
        this.tokens = tokens;
        this.cursor = 0;
    };

    Evaluatex.Parser.prototype.accept = function(token) {
        if (!this.current()) return false;

        while (this.current().type == "WS") {
            this.cursor++;
        }

        if (this.current().type == token) {
            this.cursor++;
            return true;
        }
        return false;
    };

    Evaluatex.Parser.prototype.expect = function(token) {
        if (!this.accept(token)) {
            throw "Expected " + token + " but got " + this.current();
        }
    };

    Evaluatex.Parser.prototype.current = function() {
        return this.tokens[this.cursor];
    };

    Evaluatex.Parser.prototype.prev = function() {
        return this.tokens[this.cursor - 1];
    }

    Evaluatex.Parser.prototype.val = function() {
        if (this.accept("SYMBOL")) {
            return new Node("SYMBOL", this.prev().value);
        }
        else if (this.accept("PM")) {
            var node = new Node("NEGATE");
            node.add(this.val());
            return node;
        }
        else if (this.accept("NUMBER")) {
            return new Node("NUMBER", this.prev().value);
        }
        else if (this.accept("FUNCTION")) {
            var node = new Node("FUNCTION", this.prev().value);
            node.add(this.val());
            return node;
        }
        else if (this.accept("LPAREN")) {
            var node = new Node("EXPR");
            node.add(this.pmExpr());
            this.expect("RPAREN");
            return node;
        }
        else {
            throw "Syntax Error at position " + this.current().value + " " + this.cursor;
        }
    };

    Evaluatex.Parser.prototype.pmExpr = function() {
        var node = new Node("PM");
        node.add(this.mdExpr());
        if (this.accept("PM")) {
            node.add(this.pmExpr());
        }
        return node;
    };

    Evaluatex.Parser.prototype.mdExpr = function() {
        var node = new Node("MD");
        node.add(this.pwExpr());
        if (this.accept("MD")) {
            node.add(this.mdExpr());
        }
        return node;
    };

    Evaluatex.Parser.prototype.pwExpr = function() {
        var node = new Node("PW");
        node.add(this.val());
        if (this.accept("POW")) {
            node.add(this.pwExpr());
        }
        return node;
    }

    module.exports = Evaluatex;
})();