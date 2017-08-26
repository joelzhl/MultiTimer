/*
 * Runs multiple timer at the same time
 * Ability to add label to each timer
 * -- Quick button to add 1, 2, 5, 10 minutes to each timer while they are running
 * Alarm sets off when each timer finish
 *
 */

// each timerInput is an array of [s s m m h h] going backwards
var defaultTimer = [1, 0, 0]; // default 60 seconds;
var currentTimerInput = defaultTimer;
var timers = [];
var timerIDCounter = 0;
var chime;
var playChime = false;
var labelList = [];

$(document).ready(function () {
    chime = document.getElementById("chime-mp3");
    $("#time-input").focusin(readyInputField);
    $("#time-input").focusout(function () {
        $(this).children().removeClass("text-muted");
        $(this).children("span.input-number:last").removeClass("seconds-box-blink");
        // if (currentTimerInput.length = 0)
        // currentTimerInput = lastTimerInput;
        // console.log("focusout");
    });
    $("#time-input").keyup(function (e) {
        var key = e.which || e.keyCode;
        if ((key == 48 || key == 96) && currentTimerInput.length == 0)
            return;
        if (key >= 96 && key <= 105)
            key -= 48; // Numpad -> numbers
        if (key >= 48 && key <= 57 && currentTimerInput.length < 6) { // NUM -> push list
            currentTimerInput.push(key - 48);
            populateInputField(currentTimerInput);
        } else if (key == 8 && currentTimerInput.length > 0) { // BACKSPACE -> pop list
            currentTimerInput.pop();
            populateInputField(currentTimerInput);
        } else if (key == 13) { // ENTER -> process input
            addTimer();
            $(this).children().removeClass("text-muted");
            $(this).children("span.input-number:last").removeClass("seconds-box-blink");
            $("#time-input").blur();
        }
    });

    $("#btn-add-timer").click(addTimer);
    $("#btn-reset-timer").click(function () {
        currentTimerInput = defaultTimer;
        populateInputField(currentTimerInput);
    });
    $("#btn-clear-label").click(function () {
        localStorage.removeItem("label");
        $("ul.dropdown-menu").empty();
    });

    populateInputField(currentTimerInput);

    setInterval(timerCountDown, 1000);
    $("#time-input").focus();
});

function readyInputField() {
    $("#time-input").children().addClass("text-muted");
    $("#time-input").children("span.input-number:last").addClass("seconds-box-blink");
    // lastTimerInput = currentTimerInput;
    currentTimerInput = [];
    $("#time-input").children("span.input-number").text(0);
    // console.log("clearing input field!!!");
}

function populateInputField(timerInput) {
    $("#time-input").children().addClass("text-muted");
    $("#time-input").children("span.input-number").text(0);
    var digits = $("#time-input").children("span.input-number:last");
    for (i = timerInput.length; i > 0; i--) {
        var item = timerInput[i - 1];
        digits.removeClass("text-muted");
        digits.text(item);
        digits = digits.prevAll("span.input-number").first();
        switch (i) {
        case 1:
            $("#secs").removeClass("text-muted");
            break;
        case 3:
            $("#mins").removeClass("text-muted");
            break;
        case 5:
            $("#hrs").removeClass("text-muted");
            break;
        }
    }
}

function Timer(sec) {
    this.id = timerIDCounter++;
    this.seconds = sec;
    this.original = sec;
    this.format = function (hhmmss, useLabel) {
        hhmmss = ("00" + hhmmss[0]).substring(hhmmss[0].toString().length) + (useLabel ? "h " : ":") +
        ("00" + hhmmss[1]).substring(hhmmss[1].toString().length) + (useLabel ? "m " : ":") +
        ("00" + hhmmss[2]).substring(hhmmss[2].toString().length) + (useLabel ? "s" : "");
        var i = hhmmss.search(/[1-9]/); // find the index of the first non zero digit
        if (i < 0) { // mute the whole string
            hhmmss = '<span class="text-muted">' + hhmmss + '</span>';
        } else if (i > 0) {
            hhmmss = '<span class="text-muted">' + hhmmss.substring(0, i) + '</span>' + hhmmss.substring(i);
        }
        return hhmmss;
    };
    this.getFormatted = function () {
        return this.format([Math.abs(~~(this.seconds / 3600)), Math.abs(~~(this.seconds % 3600 / 60)), Math.abs(this.seconds % 60)], false);
    };
    this.getOrigFormatted = function () {
        return this.format([~~(this.original / 3600), ~~(this.original % 3600 / 60), this.original % 60], true);
    };
    this.timerRow = $("<div />");
    this.timerRow.addClass("row timer-row");
    this.timerRow.data("tid", this.id);

    var html = "";
    var labels = (typeof localStorage.label == "undefined") ? [] : localStorage.label.split('|');
    for (i in labels) {
        html = html + '<li><a onclick="fillLabel(event)">' + labels[i] + '</a></li>';
    }

    var btns = '<span onclick="resetTimer(event)" class="glyphicon glyphicon-repeat"></span>' +
        '<span onclick="removeTimer(event)" class="glyphicon glyphicon-remove"></span>' +
        '<span onclick="toggleEdit(event)" class="glyphicon glyphicon-edit"></span>';
    this.timerRow.html('<div class="col-lg-2 col-md-3 col-sm-4 col-xs-4"><h6 class="text-information">' + this.getOrigFormatted() + 
        '<span class="label label-danger" style="display: none">overtime</span></h6><h2 class="' +
        ((this.seconds < 0) ? "text-danger" : ((this.seconds >= 0 && this.seconds < 60) ? "text-success" : "")) +
        '">' + this.getFormatted() + "</h2>" + btns + "</div>" +
        '<div class="col-lg-10 col-md-9 col-sm-8 col-xs-8"><form onsubmit="return submitLabel(event)">' +
        '<div class="dropdown">' +
        '<button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">For' +
        '  <span class="caret"></span></button>' +
        '  <ul class="dropdown-menu">' + html +
        '  </ul>' +
        '</div>' +
        '<div class="input-group"><input class="form-control" type="text" placeholder="label..." name="lbl"></input></div></form></div>');
    // this.timerRow.find("div h2").contextmenu(removeTimer);

    var btnGrpPlusMinus = $('<div class="btn-grp-plus-minus" />');
    this.timerRow.children("div:first").append(btnGrpPlusMinus);
    btnGrpPlusMinus.append('<a href="#" class="btn-plus-hour" onclick="changeTimer(event, 3600)"><span class="glyphicon glyphicon-plus"></span></a>');
    btnGrpPlusMinus.append('<a href="#" class="btn-minus-hour" onclick="changeTimer(event, -3600)"><span class="glyphicon glyphicon-minus"></span></a>');
    btnGrpPlusMinus.append('<a href="#" class="btn-plus-min" onclick="changeTimer(event, 60)"><span class="glyphicon glyphicon-plus"></span></a>');
    btnGrpPlusMinus.append('<a href="#" class="btn-minus-min" onclick="changeTimer(event, -60)"><span class="glyphicon glyphicon-minus"></span></a>');
    btnGrpPlusMinus.append('<a href="#" class="btn-plus-sec" onclick="changeTimer(event, 1)"><span class="glyphicon glyphicon-plus"></span></a>');
    btnGrpPlusMinus.append('<a href="#" class="btn-minus-sec" onclick="changeTimer(event, -1)"><span class="glyphicon glyphicon-minus"></span></a>');

    this.update = function () {
        var display = this.timerRow.find("div h2");
        display.removeClass();
        display.addClass((this.seconds <= 0) ? "text-danger" : ((this.seconds > 0 && this.seconds < 60) ? "text-success" : ""));
        display.html(this.getFormatted());
        if (this.seconds <= 0 && this.seconds > -6) {
            playChime = true;
        } 
        var label = this.timerRow.find("div h6 span.label");
        if (this.seconds < 0) {
            label.css({"display": "inline"});
        } else {
            label.css({"display" : "none"});
        }
        this.timerRow.data("seconds", this.seconds);
    };
}

function timerCountDown() {
    playChime = false;
    for (t in timers) {
        timers[t].seconds--;
        timers[t].update();
    }
    if (playChime && chime.paused) {
        chime.currentTime = 0;
        chime.play()
    } else {
        chime.pause();
    }
}

function addTimer(sec) {
    console.log("processing input: " + currentTimerInput);
    var seconds = 0;
    if (isNaN(sec)) {
        for (i = 0; i < currentTimerInput.length; i++) {
            switch (i) {
            case 0:
                seconds += currentTimerInput[currentTimerInput.length - i - 1];
                break;
            case 1:
                seconds += currentTimerInput[currentTimerInput.length - i - 1] * 10;
                break;
            case 2:
                seconds += currentTimerInput[currentTimerInput.length - i - 1] * 60;
                break;
            case 3:
                seconds += currentTimerInput[currentTimerInput.length - i - 1] * 600;
                break;
            case 4:
                seconds += currentTimerInput[currentTimerInput.length - i - 1] * 3600;
                break;
            case 5:
                seconds += currentTimerInput[currentTimerInput.length - i - 1] * 36000;
                break;
            default:
                alert("Oops, something broke! Alert the time police!");
            }
        }

        if (seconds > 360060)
            seconds = 360060;
    } else {
        seconds = parseInt(sec);
    }
    
    console.log("creating timer: " + seconds + " seconds...");

    var newTimer = new Timer(seconds);
    newTimer.update();
    timers.push(newTimer);
    timers.sort(function (a, b) {
        return a.seconds - b.seconds;
    });

    var timerList = $("#timer-list");
    var tidx = timers.indexOf(newTimer);
    if (tidx < 0) {
        console.log("error: bad timer index");
    } else if (tidx == 0) {
        timerList.prepend(newTimer.timerRow);
    } else {
        newTimer.timerRow.insertAfter(timerList.children("div:nth-of-type(" + tidx + ")"));
    }
}

function removeTimer(event) {
    var timerRow = $(event.target).parents(".timer-row");
    var tId = timerRow.data("tid");
    var timer = timers.splice(timers.findIndex(function (t) {
                return t.id == tId;
            }), 1);
    console.log("removing timer tid=" + tId);
    timerRow.remove();
    return false;
}

// reorganize the timer list display
function reorganizeTimer(timerRow) {
    var thisSecs = parseInt(timerRow.data("seconds"));
    var prevSecs = parseInt(timerRow.prev().data("seconds"));
    var nextSecs = parseInt(timerRow.next().data("seconds"));
    while (!(prevSecs === undefined) && thisSecs < prevSecs) {
        timerRow.insertBefore(timerRow.prev());
        prevSecs = parseInt(timerRow.prev().data("seconds"));
    }
    while (!(nextSecs === undefined) && thisSecs > nextSecs) {
        timerRow.insertAfter(timerRow.next());
        nextSecs = parseInt(timerRow.next().data("seconds"));
    }
}

function resetTimer(event) {
    var timerRow = $(event.target).parents(".timer-row");
    var tid = timerRow.data("tid");
    var timer = timers.find(function (t) {
        return t.id == tid;
    });
    console.log("resetting timer tid=" + tid);
    console.log(timer);
    timer.seconds = timer.original;
    timer.update();

    reorganizeTimer(timerRow);
    
    return false;
}

function submitLabel(event) {
    $("input").blur();
    var lbl = event.target["lbl"].value;
    if (typeof localStorage.label != "undefined") {
        if (localStorage.label.indexOf(lbl) != -1) {
            return false;
        } else {
            localStorage.label = localStorage.label + "|" + lbl;
        }
    } else {
        localStorage.label = lbl;
    }
    var html = "";
    var labels = localStorage.label.split('|');
    for (i in labels) {
        html = html + '<li><a onclick="fillLabel(event)">' + labels[i] + '</a></li>';
    }
    $("ul.dropdown-menu").empty();
    $("ul.dropdown-menu").append(html);

    return false;
}

function fillLabel(event) {
    event.target.parentNode.parentNode.parentNode.parentNode["lbl"].value = event.target.text;
}

function toggleEdit(event) {
    var timerRow = $(event.target).parents(".timer-row");
    var btnGrpPlusMinus = timerRow.find(".btn-grp-plus-minus");
    btnGrpPlusMinus.toggle(100);
    reorganizeTimer(timerRow);
}

function changeTimer(event, change) {
    var timerRow = $(event.target).parents(".timer-row");
    var tid = timerRow.data("tid");
    var timer = timers.find(function (t) {
        return t.id == tid;
    });

    timer.seconds += change;
    timer.update();
    
    reorganizeTimer(timerRow);
}