const AnswerTemplate = '<div class="col-sm-6 d-grid"><input type="checkbox" class="btn-check Answer" id="Anwser_#=Id#" autocomplete="off"><label id="AnswerButton#=Id#" class="btn btn-outline-primary" for="Anwser_#=Id#">#=Question#</label></div>';
const AnwserGroupTemplate = '<div class="row formRow">#=Content#</div>';

const FinalSummaryGroupContainer = '<div class="list-group list-group-horizontal-sm col-sm-12">#=Content#</div>';
const FinalSummaryItemGroupContainer = '<a draggable="false" href="#=Link#" class="list-group-item #=Status# col-1">#=Content#</a>';
const FinalSummarydefaultGroupContainer = '<div class="list-group-item col-1"></div>';
const FinalSummaryCard = '<div id="#=Id#" class="card cardExtension"><h5 class="card-header #=Border#">#=Question#</h5><div class="card-body"><div class="container"><ul class="list-group cardExtension">#=Answers#</ul></div><div class="card-text cardExtension text-Secondary">#=UserAnswer#</div><div class="alert alert-info" role="alert">#=Explanation#</div></div></div>';

var Page = 0;
let labels;
const Content = []
const $ = require('../Content/Dependencies/jquery/jquery-3.6.1.min.js');
const { ipcRenderer, contentTracing } = require('electron');
const results = [];

window.onload = function () {
    let url = new URL(document.location.href);
    let searchParams = new URLSearchParams(url.search);
    console.log(searchParams.get('Path'));
    document.getElementById("content").innerHTML = searchParams.get('Name');
    ipcRenderer.send('GetFileQCM', searchParams.get('Path'))
    ipcRenderer.send('GetLabels');

    document.getElementById('Valid_Answer').addEventListener('click', ValidAnwser);
    document.getElementById('Next_Answer').addEventListener('click', Next_Question);

    $("#FinalContainer").hide();
    $("#Quit").hide();
}

ipcRenderer.on('GetLabelsResponse', (event, data) => {
    labels = data
})

ipcRenderer.on('FileQCM', (_event, data) => {
    if (data == null && data.length > 1) {
        return;
    }

    for (let i = 1; i < data.length; i++) {
        Content.push(data[i]);
    }

    console.log(data);

    LoadQuestion(1);
})

//#region Questions management


function Next_Question() {
    if (Page < Content.length) {
        LoadQuestion(Page + 1);
    } else {
        $('#Next_Answer').hide();
        $('#Valid_Answer').hide();
        $('#QuestionContainer').hide();
        DisplayFinalSummary();
    }
}

/**
 * Load data questions
 */
function LoadQuestion(questionId) {
    Page = questionId;
    $("#Page").text(questionId + '/' + Content.length);
    let question = Content[questionId - 1];

    // Hide and show buttons
    $('#Next_Answer').hide();
    $('#Valid_Answer').show();
    $('Question_Utility_Label').show();
    // Load question label
    $("#Question_Label").text(question[0]);

    // Load & hide explanation
    $("#Question_explanation").hide();
    $("#Question_explanation").text(question[2]);

    // Load answers
    let answers = [];
    for (let i = 3; i < question.length; i++) {
        let answer = question[i];
        if (answer == '' || answer == null) {
            break;
        }
        let answerContent = AnswerTemplate.replace('#=Question#', answer);
        answerContent = answerContent.replaceAll('#=Id#', (i - 2)); // - 2 because start to 1
        answers.push(answerContent);
    }

    answers = shuffle(answers);

    let questionGroup = [];

    let responseContainer = document.getElementById('Response_Quantity');
    responseContainer.innerHTML = '';

    for (let i = 0; i < answers.length; i++) {
        let answer = answers[i];

        if (questionGroup.length == 2) {
            responseContainer.innerHTML += AnwserGroupTemplate.replace("#=Content#", questionGroup.join(''));
            questionGroup = [];
        }

        questionGroup.push(answer);
    }

    responseContainer.innerHTML += AnwserGroupTemplate.replace("#=Content#", questionGroup.join(''));
    questionGroup = [];
}

function ValidAnwser() {
    // Hide elements
    $('Question_Utility_Label').hide();

    // Get user answers
    var anwsers = document.getElementsByClassName('Answer');

    let selectedAnwsers = [];
    for (let i = 0; i < anwsers.length; i++) {
        let element = anwsers[i];
        element.setAttribute('disabled', '');

        if (element.checked) {
            let id = element.id;
            id = id.replace('Anwser_', '');
            selectedAnwsers.push(id);
        }
    };

    console.log(selectedAnwsers);

    // Get question answers
    let currentQuestion = Content[Page - 1];

    let goodAnswers = currentQuestion[1].split(' ');
    let success = true;
    // Any anwsers have to appear
    for (let i = 0; i < selectedAnwsers.length; i++) {
        let isInResponse = goodAnswers.find(answer => answer == selectedAnwsers[i]);
        if (isInResponse == undefined) {
            $('#AnswerButton' + selectedAnwsers[i]).removeClass("btn-outline-primary").addClass("btn-danger");
            success = false;
        }
    }

    for (let i = 0; i < goodAnswers.length; i++) {
        let isInResponse = selectedAnwsers.find(answer => answer == goodAnswers[i]);
        if (isInResponse == undefined) {
            success = false;
            $('#AnswerButton' + goodAnswers[i]).removeClass("btn-outline-primary").addClass("btn-outline-success");
        } else {
            $('#AnswerButton' + goodAnswers[i]).removeClass("btn-outline-primary").addClass("btn-success");
        }


    }

    // Display Explanation
    $("#Question_explanation").show();

    // Hide and show buttons
    $('#Next_Answer').show();
    $('#Valid_Answer').hide();

    results.push({
        question: currentQuestion,
        reponses: selectedAnwsers,
        goodAnswers: goodAnswers,
        success: success
    });
}
//#endregion

function DisplayFinalSummary() {
    // display container
    $("#FinalContainer").show();

    // Fill statistics
    DisplayFinalBaseStats()

    // Display base summary
    DisplayFinalBaseSummary();

    // Display final base cards
    DisplayFinalCardSummary();

    // Show quit button
    $("#Quit").show();
}

function DisplayFinalBaseStats() {
    let item = document.getElementById('FinalAnswerStats');
    let value = item.innerText;

    // Count number of good responses
    let numberOfGoodAnswer = 0;
    for (let i = 0; i < results.length; i++) {
        if (results[i].success) {
            numberOfGoodAnswer++;
        }
    }

    // display number
    value = value.replace('#=CorrectAnwser#', numberOfGoodAnswer);
    value = value.replace('#=Total#', results.length);
    let percentage = Math.floor((numberOfGoodAnswer * 100) / results.length);
    value = value.replace('#=percentage#', percentage);

    if (percentage < 50) {
        $('#FinalAnswerStats').addClass('alert-danger');
    } else if (percentage < 60) {
        $('#FinalAnswerStats').addClass('alert-warning');
    } else if (percentage = 100) {
        $('#FinalAnswerStats').addClass('alert-success');
    } else {
        $('#FinalAnswerStats').addClass('alert-primary');
    }
    // show data
    item.innerHTML = value;
}

function DisplayFinalBaseSummary() {
    let container = document.getElementById("FinalAnswerSummary");
    container.innerHTML = '';

    let questionGroup = [];
    for (let i = 0; i < results.length; i++) {
        // Display question number
        let item = FinalSummaryItemGroupContainer.replace('#=Content#', (i + 1));

        // set link
        item = item.replace('#=Link#', '#' + (i + 1));

        // set result status
        if (results[i].success) {
            item = item.replace('#=Status#', 'list-group-item-success');
        } else {
            item = item.replace('#=Status#', 'list-group-item-danger');
        }

        // manage question group rows
        if (questionGroup.length == 10) {
            questionGroup.splice(0, 0, FinalSummarydefaultGroupContainer);
            questionGroup.push(FinalSummarydefaultGroupContainer);
            container.innerHTML += FinalSummaryGroupContainer.replace('#=Content#', questionGroup.join(''));

            questionGroup = [];
        }

        // Insert item
        questionGroup.push(item);
    }

    // Manage question group
    questionGroup.splice(0, 0, FinalSummarydefaultGroupContainer);
    questionGroup.push(FinalSummarydefaultGroupContainer);
    if (questionGroup.length < 12) {
        let missingQuantity = 12 - questionGroup.length;
        for (let i = 0; i < missingQuantity; i++) {
            questionGroup.push(FinalSummarydefaultGroupContainer);
        }
    }

    container.innerHTML += FinalSummaryGroupContainer.replace('#=Content#', questionGroup.join(''));
}

function DisplayFinalCardSummary() {
    let item = document.getElementById('FinalCardSummary');
    item.innerHTML = '';

    for (let i = 0; i < results.length; i++) {
        let result = results[i];

        let content = FinalSummaryCard.replace('#=Question#', (i + 1) + ' - ' + result.question[0]);
        content = content.replace('#=Id#', (i + 1));
        content = content.replace('#=Explanation#', result.question[2]);

        if (result.success) {
            content = content.replace('#=Border#', 'border-success text-success');
        } else {
            content = content.replace('#=Border#', 'border-danger text-danger');
        }

        let responses = []
        let userResponses = []
        // manage responses
        for (let i = 3; i < result.question.length; i++) {
            let answerContent = result.question[i];
            if (answerContent == '' || answerContent == null) {
                break;
            }

            let response = '<li  class="list-group-item #=Status#">' + answerContent + '</li>';
            let responseNumber = '' + (i - 2) + '';
            let isGoodResponse = result.goodAnswers.find(answer => answer == responseNumber);
            let isSelectedResponse = result.reponses.find(answer => answer == responseNumber);
            if (isGoodResponse) {
                response = response.replace('#=Status#', 'list-group-item-success');
            }

            if (isSelectedResponse && isGoodResponse == undefined) {
                response = response.replace('#=Status#', 'list-group-item-danger');
            }

            if (isSelectedResponse) {
                userResponses.push('"' + result.question[i] + '"');
            }

            responses.push(response);
        }

        content = content.replace('#=Answers#', responses.join(''));
        if (userResponses.length == 0) {
            content = content.replace('#=UserAnswer#', labels['QCM-Stats_NoAnswer']);
        } else {
            content = content.replace('#=UserAnswer#', labels['QCM-Stats_YourAnswers'] + userResponses.join(', '));
        }

        item.innerHTML += content;
    }
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}