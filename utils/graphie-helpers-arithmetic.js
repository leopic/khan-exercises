(function() {

var decimalPointSymbol = icu.getDecimalFormatSymbols().decimal_separator;

function Adder(a, b, digitsA, digitsB) {
    var graph = KhanUtil.currentGraph;
    digitsA = digitsA || KhanUtil.digits(a);
    digitsB = digitsB || KhanUtil.digits(b);
    var highlights = [];
    var carry = 0;
    var pos = { max: Math.max(digitsA.length, digitsB.length, KhanUtil.digits(a + b).length),
        carry: 3,
        first: 2,
        second: 1,
        sum: 0,
        sideX: Math.max(digitsA.length, digitsB.length) + 2,
        sideY: 1.5 };

    var index = 0;
    var numHints = Adder.numHintsFor(a, b);

    this.show = function() {
        graph.init({
            range: [[-1, 11], [pos.sum - 0.5, pos.carry + 0.5]],
            scale: [20, 40]
        });

        drawDigits(digitsA.slice(0).reverse(), pos.max - digitsA.length + 1, pos.first);
        drawDigits(digitsB.slice(0).reverse(), pos.max - digitsB.length + 1, pos.second);

        graph.path([[-0.5, pos.second - 0.5], [pos.max + 0.5, pos.second - 0.5]]);
        graph.label([0, 1] , "\\LARGE{+\\vphantom{0}}");
    };

    this.showHint = function() {
        this.removeHighlights();
        if ((index === numHints - 2) && (numHints - 1 > digitsA.length)) {
            this.showFinalCarry();
            index++;
            return;
        } else if (index === numHints - 1) {
            return;
        }
        var prevCarry = carry;
        var prevCarryStr = "";
        var carryStr = "";
        var addendStr = "";
        var sum;

        var x = pos.max - index;

        if (prevCarry !== 0) {
            highlights.push(graph.label([x, pos.carry], "\\color{#6495ED}{" + prevCarry + "}", "below"));
            prevCarryStr = "\\color{#6495ED}{" + prevCarry + "} + ";
        }

        sum = digitsA[index] + carry;
        highlights = highlights.concat(drawDigits([digitsA[index]], x, pos.first, KhanUtil.BLUE));

        if (index < digitsB.length) {
            highlights = highlights.concat(drawDigits([digitsB[index]], x, pos.second, KhanUtil.BLUE));
            addendStr = " + \\color{#6495ED}{" + digitsB[index] + "}";
            sum += digitsB[index];
        }

        drawDigits([sum % 10], x, pos.sum);
        highlights = highlights.concat(drawDigits([sum % 10], x, pos.sum, KhanUtil.GREEN));

        carry = Math.floor(sum / 10);
        if (carry !== 0) {
            highlights.push(graph.label([x - 1, pos.carry],
                "\\color{#FFA500}{" + carry + "}", "below"));
            carryStr = "\\color{#FFA500}{" + carry + "}";
        }

        this.showSideLabel("\\Large{"
            + prevCarryStr
            + "\\color{#6495ED}{" + digitsA[index] + "}"
            + addendStr
            + " = "
            + carryStr
            + "\\color{#28AE7B}{" + sum % 10 + "}"
            + "}");

        index++;
    };

    this.showFinalCarry = function() {
        highlights.push(graph.label([pos.max - index, pos.carry],
            "\\color{#6495ED}{" + carry + "}", "below"));
        graph.label([pos.max - index, pos.sum], "\\LARGE{" + carry + "}");
        highlights.push(graph.label([pos.max - index, pos.sum],
            "\\LARGE{\\color{#28AE7B}{" + carry + "}}"));

        this.showSideLabel("\\Large{"
            + "\\color{#6495ED}{" + carry + "}"
            + " = "
            + "\\color{#28AE7B}{" + carry + "}"
            + "}");
    };

    this.getNumHints = function() {
        return numHints;
    };

    this.removeHighlights = function() {
        while (highlights.length) {
            highlights.pop().remove();
        }
    };

    this.showSideLabel = function(str) {
        highlights.push(graph.label([pos.sideX, pos.sideY], str, "right"));
    };

    this.showDecimals = function(deciA, deciB) {
        for (var i = 0; i < 3; i++) {
            graph.style({ fill: "#000" }, function() {
                graph.label([pos.max - Math.max(deciA, deciB) + 0.5, i - 0.1],
                    "\\LARGE{" + decimalPointSymbol + "}", "center", true);
            });
        }
        this.showSideLabel("\\text{Make sure the decimals are lined up.}");
    }
}

Adder.numHintsFor = function(a, b) {
    return KhanUtil.digits(a + b).length + 1;
};

function Subtractor(a, b, digitsA, digitsB, decimalPlaces) {
    var graph = KhanUtil.currentGraph;
    digitsA = digitsA || KhanUtil.digits(a);
    digitsB = digitsB || KhanUtil.digits(b);
    var workingDigitsA = digitsA.slice(0);
    var workingDigitsB = digitsB.slice(0);
    var highlights = [];
    var carry = 0;
    var pos = { max: digitsA.length,
        carry: 3,
        first: 2,
        second: 1,
        diff: 0,
        sideX: Math.max(digitsA.length, digitsB.length) + 2,
        sideY: 1.5 };

    var index = 0;
    var numHints = Subtractor.numHintsFor(a, b);
    decimalPlaces = decimalPlaces || 0;

    this.show = function() {
        graph.init({
            range: [[-1, 11], [pos.diff - 0.5, pos.carry + 0.5]],
            scale: [20, 40]
        });
        drawDigits(digitsA.slice(0).reverse(), pos.max - digitsA.length + 1, pos.first);
        drawDigits(digitsB.slice(0).reverse(), pos.max - digitsB.length + 1, pos.second);

        graph.path([[-0.5, pos.second - 0.5], [pos.max + 0.5, pos.second - 0.5]]);
        graph.label([0, 1] , "\\LARGE{-\\vphantom{0}}");

        for (var i = 0; i < digitsA.length; i++) {
            highlights.unshift([]);
        }
    };

    this.borrow = function(idx) {
        var borrowedIdx = idx + 1;
        if (workingDigitsA[idx + 1] < 1) {
            borrowedIdx = this.borrow(idx + 1);
        }
        workingDigitsA[idx + 1] -= 1;
        workingDigitsA[idx] += 10;

        var depth = borrowedIdx - idx - 1;

        highlights[idx].push(graph.label([pos.max - idx, pos.carry + (0.5 * depth)],
                                             "\\color{#6495ED}{" + workingDigitsA[idx] + "}", "below"));
        highlights[idx].push(graph.path([[pos.max - 0.3 - idx, pos.first - 0.4], [pos.max + 0.3 - idx, pos.first + 0.4]]));

        highlights[idx + 1].push(graph.label([pos.max - 1 - idx, pos.carry + (0.5 * depth)],
                                                 "\\color{#FFA500}{" + workingDigitsA[idx + 1] + "}", "below"));
        highlights[idx + 1].push(graph.path([[pos.max - 1.3 - idx, pos.first - 0.4], [pos.max - 0.7 - idx, pos.first + 0.4]]));
        if (depth !== 0) {
            highlights[idx + 1].push(graph.path([[pos.max - 1.3 - idx, pos.carry - 1 + (0.5 * depth)], [pos.max - 0.7 - idx, pos.carry - 0.7 + (0.5 * depth)]]));
        }
        return borrowedIdx;
    };

    this.showHint = function() {
        this.removeHighlights(index);

        if (index !== 0) {
            this.removeHighlights(index - 1);
        }
        if (index === numHints - 1) {
            return;
        }

        var value = workingDigitsA[index];
        var withinB = index < workingDigitsB.length;
        var subtrahend = withinB ? workingDigitsB[index] : 0;
        var subStr = "";

        if (value < subtrahend) {
            this.borrow(index);
        } else if (workingDigitsA[index] === digitsA[index]) {
            highlights[index].push(graph.label([pos.max - index, pos.first],
                "\\LARGE{\\color{#6495ED}{" + workingDigitsA[index] + "}}"));
        } else {
            highlights[index].push(graph.label([pos.max - index, pos.carry],
                "\\color{#6495ED}{" + workingDigitsA[index] + "}", "below"));
        }

        if (withinB) {
            highlights[index].push(graph.label([pos.max - index, pos.second],
                "\\LARGE{\\color{#6495ED}{" + workingDigitsB[index] + "}}"));
            subStr = " - \\color{#6495ED}{" + subtrahend + "}";
        }

        var diff = workingDigitsA[index] - subtrahend;
        if (((a - b) / Math.pow(10, index)) > 1 || index < decimalPlaces) {
            graph.label([pos.max - index, pos.diff], "\\LARGE{" + diff + "}");
        }

        highlights[index].push(graph.label([pos.max - index, pos.diff], "\\LARGE{\\color{#28AE7B}{" + diff + "}}"));
        if (subStr == "") {
            subStr = "- \\color{#6495ED}{ 0 }";
        }

        this.showSideLabel("\\Large{"
            + "\\color{#6495ED}{" + workingDigitsA[index] + "}"
            + subStr
            + " = "
            + "\\color{#28AE7B}{" + diff + "}}");

        index++;
    };

    this.getNumHints = function() {
        return numHints;
    };

    this.removeHighlights = function(i) {
        if (i >= highlights.length) {
            return;
        }

        var col = highlights[i];
        while (col.length) {
            col.pop().remove();
        }
    };

    this.showSideLabel = function(str) {
        highlights[index].push(graph.label([pos.sideX, pos.sideY], str, "right"));
    };

    this.showDecimals = function(deciA, deciB) {
        for (var i = 0; i < 3; i++) {
            graph.style({ fill: "#000" }, function() {
                graph.label([pos.max - Math.max(deciA, deciB) + 0.5, i - 0.1],
                    "\\LARGE{" + decimalPointSymbol + "}", "center", true);
            });
        }
        this.showSideLabel("\\text{Make sure the decimals are lined up.}");
    };
}

Subtractor.numHintsFor = function(a, b) {
    return KhanUtil.digits(a).length + 1;
};

// convert Adder -> DecimalAdder and Subtractor -> DecimalSubtractor
(function() {
    var decimate = function(drawer) {
        var news = function(a, aDecimal, b, bDecimal) {
            var newA = a * (bDecimal > aDecimal ? Math.pow(10, bDecimal - aDecimal) : 1);
            var newB = b * (aDecimal > bDecimal ? Math.pow(10, aDecimal - bDecimal) : 1);
            return [newA, newB];
        };

        var decimated = function(a, aDecimal, b, bDecimal) {
            var newAB = news(a, aDecimal, b, bDecimal);
            var newA = newAB[0], newB = newAB[1];

            var aDigits = KhanUtil.digits(newA);
            for (var i = 0; i < (aDecimal - bDecimal) || aDigits.length < aDecimal + 1; i++) {
                aDigits.push(0);
            }

            var bDigits = KhanUtil.digits(newB);
            for (var i = 0; i < (bDecimal - aDecimal) || bDigits.length < bDecimal + 1; i++) {
                bDigits.push(0);
            }
            var drawn = new drawer(newA, newB, aDigits, bDigits, Math.max(aDecimal, bDecimal));

            drawn.showDecimals = (function(old) {
                return function() {
                    old.call(drawn, aDecimal, bDecimal);
                }
            })(drawn.showDecimals);

            return drawn;
        };

        decimated.numHintsFor = function(a, aDecimal, b, bDecimal) {
            var newAB = news(a, aDecimal, b, bDecimal);
            var newA = newAB[0], newB = newAB[1];

            return drawer.numHintsFor(newA, newB);
        };

        return decimated;
    };

    // I hate global variables
    KhanUtil.DecimalAdder = decimate(Adder);
    KhanUtil.DecimalSubtractor = decimate(Subtractor);
})();

function drawCircles(num, color) {
    with (KhanUtil.currentGraph) {
        var numCols = Math.floor(Math.sqrt(num));
        var numRows = Math.floor(num / numCols);
        var extra = num % numRows;

        init({
            range: [[0, numCols + 1], [-1, numRows + 2]],
            scale: [30, 30]
        });

        style({
            stroke: color,
            fill: color
        });

        for (var i = numRows; i > 0; i--) {
            for (var j = numCols; j > 0; j--) {
                circle([j, i], 0.25);
            }
        }

        for (var j = extra; j > 0; j--) {
            circle([j, 0], 0.25);
        }
    }
}

function crossOutCircles(numCircles, numCrossed, color) {
    with (KhanUtil.currentGraph) {
        var numCols = Math.floor(Math.sqrt(numCircles));
        var numRows = Math.floor(numCircles / numCols);
        var extra = numCircles % numRows;
        var count = 0;

        style({
            stroke: color,
            fill: color
        });

        for (var i = numRows; i > 0; i--) {
            for (var j = numCols; j > 0; j--) {
                path([[j - 0.3, i - 0.3], [j + 0.3, i + 0.3]]);
                path([[j - 0.3, i + 0.3], [j + 0.3, i - 0.3]]);
                count += 1;
                if (count === numCrossed) {
                    return;
                }
            }
        }

        for (var j = extra; j > 0; j--) {
            path([[j - 0.3, i - 0.3], [j + 0.3, i + 0.3]]);
            path([[j - 0.3, i + 0.3], [j + 0.3, i - 0.3]]);
            count += 1;
            if (count === numCrossed) {
                return;
            }
        }
    }
}

function drawDigits(digits, startX, startY, color) {
    var graph = KhanUtil.currentGraph;
    var set = [];
    $.each(digits, function(index, digit) {
        var str = "\\LARGE{" + digit + "}";
        set.push(graph.label([startX + index, startY], str, { color: color }));
    });
    return set;
}

// for multiplication 0.5, 1
function drawRow(num, y, color, startCount) {
    var graph = KhanUtil.currentGraph;

    graph.style({
        stroke: color
    });

    var set = graph.raphael.set();
    for (var x = 0; x < num; x++) {
        set.push(graph.label([x, y], "\\small{\\color{" + color + "}{" + (startCount + x) + "}}"));
        set.push(graph.circle([x, y], 0.25));
    }

    return set;
}

function Multiplier(a, b, digitsA, digitsB, deciA, deciB) {
    var graph = KhanUtil.currentGraph;
    deciA = deciA || 0;
    deciB = deciB || 0;
    digitsA = digitsA || KhanUtil.digits(a);
    digitsB = digitsB || KhanUtil.digits(b);
    var digitsProduct = KhanUtil.integerToDigits(a * b);
    var highlights = [];
    var carry = 0;
    var indexA = 0;
    var indexB = 0;
    var maxNumDigits = Math.max(deciA + deciB, digitsProduct.length);
    
    var leadingZero = 0;
    for (var i=digitsB.length-1; i>0; i--) {
        if (digitsB[i] === 0) {
            leadingZero++;
        } else {
            break;
        }
    }

    var numHints = digitsA.length * (digitsB.length - leadingZero) + 1;

    this.show = function() {
        graph.init({
            range: [[-2 - maxNumDigits, 12], [-Math.max(numHints, 6), 3]],
            scale: [20, 40]
        });

        drawDigits(digitsA.slice(0).reverse(), 1 - digitsA.length, 2);
        drawDigits(digitsB.slice(0).reverse(), 1 - digitsB.length, 1);

        graph.path([[-1 - digitsProduct.length, 0.5], [1, 0.5]]);
        graph.label([- (Math.max(digitsA.length, digitsB.length)), 1] , "\\LARGE{\\times\\vphantom{0}}");
    };

    this.removeHighlights = function() {
        while (highlights.length) {
            highlights.pop().remove();
        }
    };

    this.showHint = function() {
        this.removeHighlights();

        if (indexB === digitsB.length - leadingZero) {
            this.showFinalAddition();
            return;
        }

        var bigDigit = digitsA[indexA];
        var smallDigit = digitsB[indexB];

        var product = smallDigit * bigDigit + carry;
        var ones = product % 10;
        var currCarry = Math.floor(product / 10);

        highlights = highlights.concat(drawDigits([bigDigit], -indexA, 2, KhanUtil.BLUE));
        highlights = highlights.concat(drawDigits([smallDigit], -indexB, 1, KhanUtil.PINK));
        if (carry) {
            highlights = highlights.concat(graph.label([-indexA, 3], "\\color{#FFA500}{" + carry + "}", "below"));
        }
        graph.label([2, -indexB * digitsA.length - indexA + 2],
            "\\color{#6495ED}{" + bigDigit + "}"
            + "\\times"
            + "\\color{#FF00AF}{" + smallDigit + "}"
            + (carry ? "+\\color{#FFA500}{" + carry + "}" : "")
            + "="
            + "\\color{#28AE7B}{" + product + "}", "right");

        drawDigits([ones], -indexB - indexA, -indexB);
        highlights = highlights.concat(drawDigits([ones], -indexB - indexA, -indexB, KhanUtil.GREEN));

        if (currCarry) {
            highlights = highlights.concat(graph.label([-1 - indexA, 3], "\\color{#28AE7B}{" + currCarry + "}", "below"));
            if (indexA === digitsA.length - 1) {
                drawDigits([currCarry], -indexB - indexA - 1, -indexB);
                highlights = highlights.concat(drawDigits([currCarry], -indexB - indexA - 1, -indexB, KhanUtil.GREEN));
            }
        }
        carry = currCarry;

        if (indexA === digitsA.length - 1) {
            indexB++;
            indexA = 0;
            carry = 0;
        } else {
            indexA++;
        }
    };

    this.showFinalAddition = function() {
        if (digitsB.length > 1) {
            while (digitsProduct.length < deciA + deciB + 1) {
                digitsProduct.unshift(0);
            }
            var y = leadingZero - digitsB.length;

            graph.path([[-1 - digitsProduct.length, y + 0.5], [1, y + 0.5]]);
            graph.label([-1 - digitsProduct.length, y + 1] , "\\LARGE{+\\vphantom{0}}");
            drawDigits(digitsProduct, 1 - digitsProduct.length, y);
        }
    }

    this.getNumHints = function() {
        return numHints;
    };

    this.showDecimals = function() {
        graph.style({
            fill: "#000"
        }, function() {
            if (deciA > 0)
                graph.label([-deciA + 0.5, 1.9],
                    "\\LARGE{" + decimalPointSymbol + "}", "center", true);
            if (deciB > 0)
                graph.label([-deciB + 0.5, 0.9],
                    "\\LARGE{" + decimalPointSymbol + "}", "center", true);
        });
    };

    this.showDecimalsInProduct = function() {
        var x = -maxNumDigits;
        var y = -Math.max((digitsB.length - leadingZero) * digitsA.length, 3 + digitsB.length - leadingZero);

        graph.label([x, y + 2],
            $.ngettext("\\text{The top number has 1 digit to the right of the decimal.}", "\\text{The top number has %(num)s digits to the right of the decimal.}", deciA), "right");
        graph.label([x, y + 1],
            $.ngettext("\\text{The bottom number has 1 digit to the right of the decimal.}", "\\text{The bottom number has %(num)s digits to the right of the decimal.}", deciB), "right");
        // TODO(jeresig): i18n: Should this be pluralized?
        graph.label([x, y],
                    $._("\\text{The product has %(numA)s + %(numB)s = %(numSum)s digits to the right of the decimal.}",
                        {numA: deciA, numB: deciB, numSum: deciA + deciB}),
                    "right");
        graph.style({
            fill: "#000"
        }, function() {
            var y = -digitsB.length + leadingZero;
            graph.label([-deciB - deciA + 0.5, y - 0.1],
                "\\LARGE{" + decimalPointSymbol + "}", "center", true);
            //console.log(y);
            //graph.label([-deciB - deciA + 0.5, -0.1 - digitsB.length],
            //    "\\LARGE{" + decimalPointSymbol + "}", "center", true);
        });
    };
}

function Divider(divisor, dividend, deciDivisor, deciDividend) {
    var graph = KhanUtil.currentGraph;
    var digitsDivisor = KhanUtil.integerToDigits(divisor);
    var digitsDividend = KhanUtil.integerToDigits(dividend);
    deciDivisor = deciDivisor || 0;
    deciDividend = deciDividend || 0;
    var deciDiff = deciDivisor - deciDividend;
    var highlights = [];
    var index = 0;
    var remainder = 0;
    var fOnlyZeros = true;
    var fShowFirstHalf = true;
    var leadingZeros = [];
    var value = 0;
    var decimals = [];

    this.show = function() {
        var paddedDivisor = digitsDivisor;

        if (deciDivisor !== 0) {
            paddedDivisor = (KhanUtil.padDigitsToNum(digitsDivisor.reverse(), deciDivisor + 1)).reverse();
        }
        graph.init({
            range: [[-1 - paddedDivisor.length, 17], [(digitsDividend.length + (deciDiff > 0 ? deciDiff : 0)) * -2 - 1, 2]],
            scale: [20, 40]
        });
        graph.style({
            fill: "#000"
        }, function() {
            if (deciDivisor !== 0) {
                decimals = decimals.concat(
                    graph.label([-1 - deciDivisor, -0.1],
                        "\\LARGE{" + decimalPointSymbol + "}", "center", true));
            }
            if (deciDividend !== 0) {
                decimals = decimals.concat(
                    graph.label(
                        [digitsDividend.length - deciDividend - 0.5, -0.1],
                        "\\LARGE{" + decimalPointSymbol + "}", "center", true));
            }
        });

        drawDigits(paddedDivisor, -0.5 - paddedDivisor.length, 0);
        drawDigits(digitsDividend, 0, 0);
        graph.path([[-0.75, -0.5], [-0.75, 0.5], [digitsDividend.length + (deciDiff > 0 ? deciDiff : 0), 0.5]]);
    };

    this.showHint = function() {
        this.removeHighlights();
        if (index === digitsDividend.length) {
            while (leadingZeros.length) {
                leadingZeros.pop().remove();
            }
            return;
        }

        if (fShowFirstHalf) {
            value = digitsDividend[index];
            var quotient = value / divisor;
            var total = value + remainder;
            highlights = highlights.concat(drawDigits([value], index, 0, KhanUtil.BLUE));
            if (index !== 0) {
                graph.style({
                    arrows: "->"
                }, function() {
                    highlights.push(graph.path([[index, 0 - 0.5], [index, -2 * index + 0.5]]));
                });
            }

            drawDigits([value], index, -2 * index);
            var totalDigits = KhanUtil.integerToDigits(total);
            highlights = highlights.concat(drawDigits(totalDigits, index - totalDigits.length + 1, -2 * index, KhanUtil.BLUE));

            graph.label([digitsDividend.length + 0.5, -2 * index],
                $._("\\text{How many times does }%(divisor)s" +
                    "\\text{ go into }\\color{#6495ED}{%(total)s}\\text{?}",
                    {divisor: divisor, total: total}), "right");

            fShowFirstHalf = false;
        } else {
            value += remainder;
            var quotient = Math.floor(value / divisor);
            var diff = value - (quotient * divisor);
            remainder = diff * 10;
            var quotientLabel = drawDigits([quotient], index, 1);
            if (quotient === 0 && fOnlyZeros && digitsDividend.length - deciDividend + deciDivisor > index + 1) {
                leadingZeros = leadingZeros.concat(quotientLabel);
            } else {
                fOnlyZeros = false;
            }
            highlights = highlights.concat(drawDigits([quotient], index, 1, KhanUtil.GREEN));

            var product = KhanUtil.integerToDigits(divisor * quotient);
            drawDigits(product, index - product.length + 1, -2 * index - 1);
            highlights = highlights.concat(drawDigits(product, index - product.length + 1, -2 * index - 1, KhanUtil.ORANGE));

            var diffDigits = KhanUtil.integerToDigits(diff);
            drawDigits(diffDigits, index - diffDigits.length + 1, -2 * index - 2);
            graph.label([index - product.length, -2 * index - 1] , "-\\vphantom{0}");
            graph.path([[index - product.length - 0.25, -2 * index - 1.5], [index + 0.5, -2 * index - 1.5]]);

            graph.label([digitsDividend.length + 0.5, -2 * index - 1],
                "\\color{#6495ED}{" + value + "}"
                + "\\div"
                + divisor + "="
                + "\\color{#28AE7B}{" + quotient + "}"
                + "\\text{ " + $._("or") + " }"
                + divisor
                + "\\times"
                + "\\color{#28AE7B}{" + quotient + "}"
                + " = "
                + "\\color{#FFA500}{" + (divisor * quotient) + "}", "right");
            index++;
            fShowFirstHalf = true;
        }
    }

    this.addDecimalRemainder = function() {
        dividend = dividend * 10;
        digitsDividend = KhanUtil.integerToDigits(dividend);
        deciDividend = 1;
        deciDiff = deciDivisor - deciDividend;

        this.addDecimal();
        this.show();
        graph.label([digitsDividend.length, 1],
            $._("\\text{Write in a decimal and a zero and continue dividing.}"), 
            "right");
    };

    this.getNumHints = function() {
        return Divider.numHintsFor(divisor, dividend, deciDivisor, deciDividend);
    };

    this.removeHighlights = function() {
        while (highlights.length) {
            highlights.pop().remove();
        }
    };

    this.addDecimal = function() {
        graph.style({
                fill: "#000"
            }, function() {
                graph.label([digitsDividend.length + deciDiff - 0.5, -0.1],
                    "\\LARGE{" + decimalPointSymbol + "}", "center", true);
                graph.label([digitsDividend.length + deciDiff - 0.5, 0.9],
                    "\\LARGE{" + decimalPointSymbol + "}", "center", true);
            });
    }

    this.shiftDecimals = function() {
        while (decimals.length) {
            decimals.pop().remove();
        }

        if (deciDivisor !== 0) {
            graph.label([digitsDividend.length + 1 + (deciDiff > 0 ? deciDiff : 0), 1],
                        $.ngettext("\\text{Shift the decimal 1 to the right.}",
                                   "\\text{Shift the decimal %(num)s to the right.}",
                                   deciDivisor),
                        "right");
            graph.style({
                fill: "#000"
            }, function() {
                graph.label([-1, -0.1],
                    "\\LARGE{" + decimalPointSymbol + "}", "center", true);
            });
        } else {
            // TODO(jeresig): i18n: This probably won't work in multiple langs
            graph.label([digitsDividend.length + 0.5, 1.2],
                $._("\\text{Bring the decimal up into the}"), "right");
            graph.label([digitsDividend.length + 0.5, 0.8],
                $._("\\text{answer (the quotient).}"), "right");
        }

        this.addDecimal();

        if (deciDiff > 0) {
            var orig = digitsDividend;
            digitsDividend = KhanUtil.padDigitsToNum(digitsDividend, digitsDividend.length + deciDiff);
            drawDigits(digitsDividend, 0, 0);
            highlights = highlights.concat(drawDigits(digitsDividend, 0, 0, KhanUtil.PINK));
            highlights = highlights.concat(drawDigits(orig, 0, 0));
        }
    };
}

Divider.numHintsFor = function(divisor, dividend, deciDivisor, deciDividend) {
    var digitsDividend = KhanUtil.integerToDigits(dividend);
    return 1 + (digitsDividend.length + Math.max(deciDivisor - deciDividend, 0)) * 2;
};

function squareFractions(nom, den, perLine, spacing, size) {
    spacing = spacing || 2.5;
    perLine = perLine || 10;
    size = size || 0.2;
    var graph = KhanUtil.currentGraph;
    var arr = [];
    var x = 0;
    var y = 0;

    for (y = 0; y < den / perLine && y * perLine <= nom; y++) {
        for (x = 0; x < perLine && y * perLine + x < nom; x++) {
            arr.push(graph.regularPolygon([x * spacing * size, y * 2.5 * size], 4, size, Math.PI / 4).attr("stroke", "none").attr("fill", "#6495ed").attr("stroke-linecap", "square"));
        }
    }

    y--;
    for (x = x; x < perLine; x++) {
        arr.push(graph.regularPolygon([x * spacing * size, y * 2.5 * size], 4, size, Math.PI / 4).attr("fill", "black").attr("stroke", "none").attr("stroke-linecap", "square"));
    }

    y++;
    for (y = y; y < den / perLine; y++) {
        for (x = 0; x < perLine; x++) {
            arr.push(graph.regularPolygon([x * spacing * size, y * 2.5 * size], 4, size, Math.PI / 4).attr("fill", "black").attr("stroke", "none").attr("stroke-linecap", "square"));
        }
    }


    return arr;
}

KhanUtil.Adder = Adder;
KhanUtil.Subtractor = Subtractor;
KhanUtil.Multiplier = Multiplier;
KhanUtil.Divider = Divider;
KhanUtil.drawCircles = drawCircles;
KhanUtil.drawDigits = drawDigits;
KhanUtil.drawRow = drawRow;
KhanUtil.crossOutCircles = crossOutCircles;

})();
