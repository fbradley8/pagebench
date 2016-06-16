$(document).ready(function() {
	var test = {
		number: 0,
		remaining: 0,
		failed: 0,
		total: 0,
		url: '',
		isRunning: false,
		lastResult: 0,
		lastFailed: false,
		loadTimes: [],
		results: {
			averageLoadTime: 0,
			testsPerformed: 0,
			testsSucceeded: 0,
			testsFailed: 0
		}
	};
	var queuedTests = [];
	var completedTests = [];
	var webview = $('webview');
	var failTimer;
	var sidebarMin = 200;
	var sidebarMax = 600;
	var centerMin = 600;
	const remote = require('electron').remote;

	// Event Handlers
	$('#resize-bar').mousedown(function (e) {
		e.preventDefault();
		$(document).mousemove(function (e) {
			e.preventDefault();
			var x = e.pageX;
			if (x > sidebarMin && x < sidebarMax) {  
				if (e.pageX < ($(window).width() - centerMin) || e.pageX < $('#resize-bar').offset().left) {
					$('#left-pane').css("width", x);
				}
			}
		})
	});
	$(document).mouseup(function (e) {
			$(document).unbind('mousemove');
	});
	$('#form-url, #form-tests').keypress(function (e) {
		if (e.which == 13) {
			$('#form-start').click();
			return false;
		}
	});
	$('#new-test-btn').on('click', function(e) {
		$('#new-test-form').show();
		$('#form-url').focus();
		e.stopPropagation();
	});
	$('#new-test-form').on('click', function(e) {
		$(this).show();
		e.stopPropagation();
	});
	$(document).on('click', function(e) {
		$('#new-test-form').hide();
	});
	$('webview').on('mouseup', function() { 
		$('#new-test-form').hide();
	});
	$('#window-close').on('click', function(e) {
		var window = remote.getCurrentWindow();
		window.close();
	});
	$('#window-minimize').on('click', function(e) {
		var window = remote.getCurrentWindow();
		window.minimize(); 
	});
	$('#tests-queued').on("click", "li", function(e) {
		if ($(this).index() == 0) {
			switchTab("test-view");
			$('#tests ul li').removeClass("selected");
			$(this).addClass("selected");
		}
	});
	$('#tests-completed').on("click", "li", function(e) {
		switchTab("results-view");
		$('#tests ul li').removeClass("selected");
		$(this).addClass("selected");
		loadResults($(this).index());
	});
	$('#view-results').on('click', function(e) {
		switchTab("results-view");
		$('#tests ul li').removeClass("selected");
		$('#tests ul li').last().addClass("selected");
		loadResults(completedTests.length - 1);
	});
	$('#abort-testing').on('click', function(e) {
		test.remaining = 0;
		test.isRunning = false;
		queuedTests = [];
		webview.attr('src', 'about:blank');
		updateQueue();
		$('#test-status').attr('data-status', 'idle');
	});
	$('#form-start').on('click', function(e) {
		if (validateForm()) {
			$('#new-test-form').hide();
			e.stopPropagation();
			var newTest = {
				total: parseInt($('#form-tests').val()) || 10,
				url: $('#form-url').val(),
			}
			queuedTests.push(newTest);
			updateQueue();
		}
	});
	webview[0].addEventListener('did-finish-load', loadstop);

	function loadstop() {
		if (test.isRunning && !test.lastFailed) {
			clearTimeout(failTimer);
			webview[0].executeJavaScript("JSON.stringify(window.performance.timing)", false, function(result) {
				test.lastResult = getLoadTime(JSON.parse(result));
				test.loadTimes.push(test.lastResult);
				runTest();
			});
		}
	}

	function prepareNextTest() {
		if (queuedTests[0] && test.isRunning == false) {
			test.number = 0;
			test.url = queuedTests[0].url;
			test.remaining = queuedTests[0].total;
			test.total = queuedTests[0].total;
			test.isRunning = true;
			test.failed = 0;
			test.lastResult = 0;
			test.lastFailed = false;
			test.loadTimes = [];
			test.results = {
				averageLoadTime: 0,
				testsPerformed: 0,
				testsSucceeded: 0,
				testsFailed: 0
			};
			runTest();
		}
		// else there isn't anything left in the queue
	}

	function runTest() {
		if (test.remaining > 0) {
			test.number += 1;
			test.remaining -= 1;
			webview.attr('src', test.url);
			failTimer = setTimeout(failHandler, 15000);
			test.lastFailed = false;
		} else if (test.remaining == 0 && test.isRunning == true) {
			calcResults();
			test.isRunning = false;
			completedTests.push(jQuery.extend({}, test));
			queuedTests.shift();
			updateCompleted();
			updateQueue();
		}
		updateStatus();
	}

	function getLoadTime(timings) {
		return timings.loadEventEnd - timings.navigationStart;
	}


	function calcResults() {
		var total = 0;
		for(var i = 0; i < test.loadTimes.length; i++) {
			total += test.loadTimes[i];
		}
		var average = total / test.loadTimes.length;

		test.results = {
			averageLoadTime: average,
			testsPerformed: test.total,
			testsSucceeded: test.total - test.failed,
			testsFailed: test.failed
		};

		$('#current-test-result-average').text(test.results.averageLoadTime);
	}

	// Switches between test-view and results-view
	function switchTab(view) {
		$('#center-pane').attr('data-tab', view);
	}

	// Loads test results from completedTests into the #results-view
	function loadResults(testIndex) {
		$('#test-result-average').text(completedTests[testIndex].results.averageLoadTime);
		$('#test-result-performed').text(completedTests[testIndex].results.testsPerformed);
		$('#test-result-succeeded').text(completedTests[testIndex].results.testsSucceeded);
		$('#test-result-failed').text(completedTests[testIndex].results.testsFailed);
		var labels = [];
		for (i in completedTests[testIndex].loadTimes) {
			labels.push(parseInt(i) + 1);
		}
		// render chart
		var data = {
			labels: labels,
			series: [
				{
					data: completedTests[testIndex].loadTimes
				}
			]
		};

		new Chartist.Line('#test-result-chart', data);
	}

	function updateStatus() {
		if (test.isRunning) {
			$('#test-status').attr('data-status', 'running');
			$('#test-number').text(test.number);
			$('#test-total').text(test.total);
		} else {
			$('#test-status').attr('data-status', 'completed');
		}
	}
	function updateQueue() {
		$('#title-tests-queued').hide();
		$('#tests-queued').hide();
		$('#tests-queued li').remove();
		for (i in queuedTests) {
			$('#title-tests-queued').show();
			$('#tests-queued').show();
			$('#tests-queued').append('<li title="' + queuedTests[i].url + '"><span class="fa-stack"><i class="fa fa-play fa-stack-1x"></i><i class="fa fa-spin fa-circle-o-notch fa-stack-1x"></i></span> ' + queuedTests[i].url + '</li>');
		}
		if (test.isRunning == false) {
			prepareNextTest()
		}
	}
	function updateCompleted() {
		var selectedTab = $('#tests-completed li.selected');
		var selectedIndex = null;
		if (selectedTab.length) {
			selectedIndex = selectedTab.index();
		}
		$('#title-tests-completed').hide();
		$('#tests-completed').hide();
		$('#tests-completed li').remove();
		for (i in completedTests) {
			$('#title-tests-completed').show();
			$('#tests-completed').show();
			var selected = "";
			if (i == selectedIndex) {
				selected = "selected";
			}
			$('#tests-completed').append('<li class="' + selected + '" title="' + completedTests[i].url + '">' + completedTests[i].url + '</li>');
		}
	}
	function validateForm() {
		if (!$('#form-url').val().length) {
			$('#form-url-error').show();
			return false
		}
		if ($('#form-url').val().indexOf('http') == -1) {
			$('#form-url').val('http://' + $('#form-url').val());
		}
		if (!$('#form-tests').val().length) {
			$('#form-tests').val('10');
		}
		if (isNaN(parseInt($('#form-tests').val())) || parseInt($('#form-tests').val()) <= 0) {
			$('#form-tests-error').show();
			return false
		}

		$('#form-tests-error').hide();
		$('#form-url-error').hide();
		return true
	}
	function failHandler() {
		test.lastFailed = true;
		test.failed += 1;
		// $('#test-log i').replaceWith('<span class="text-danger">Fail</span>');
		runTest();
	}

	// Init webview
	webview.attr('src', 'about:blank');
});