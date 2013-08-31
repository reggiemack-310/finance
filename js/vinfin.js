function createURL(tickers) {
    var baseURL = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20csv%20where%20url%3D'http%3A%2F%2Fdownload.finance.yahoo.com%2Fd%2Fquotes.csv%3Fs%3D";
    var paramsURL = "6f%3Dsl1p2%26e%3D.csv'%20and%20columns%3D'symbol%2Cprice%2Cchange'&format=json&diagnostics=true";
    tickersURL = "";
    for(var i=0; i<tickers.length; i++) {
        tickersURL += tickers[i] + "%2C" };
    tickersURL = tickersURL.substr(0, tickersURL.length-1)
    URL = baseURL + tickersURL + paramsURL;
    return URL;
}

function renderRecentQuotes(data) {
	console.log(data);
    var div = document.getElementById('quotes');
    div.innerHTML = '';
    for (var i=0; i<data.length; i++) {
    	var pchange = data[i].change.substr(0, data[i].change.length-1);
    	var pchangeStyle = "quote";
    	if (pchange>0) { pchangeStyle = 'changeUp' };
    	if (pchange<0) { pchangeStyle = 'changeDown' }
        if (data[i].price != 0) { div.innerHTML = div.innerHTML + '<div class="quote">' + data[i].symbol + '</div><div class="quote">' + data[i].price + '</div><div class="' + pchangeStyle + '";>' + data[i].change + '</div><br>'; }
    }
}

function removeFromArray(value, array) {
	var newArray = [];
	for (var i=0; i<array.length; i++) {
		if (array[i] != value) {
			newArray.push(array[i]);
		}
	}
	return newArray;
}

function deleteDiv(div) {
    div.parentNode.removeChild(div);
    divID = div.id;
    ticker = divID.substr(7, divID.length);
    currentTickers = removeFromArray(ticker, currentTickers);
}

function getRecentTickers() {
	return recentTickers;
}

function updateRecentQuotes(url) {
	document.getElementById('quoteTitle').innerHTML = '<div style="text-align:center">recent quotes</div>';;
    $.getJSON(url,
        function(data) {
            renderRecentQuotes(data.query.results.row);
            cData = data;
             }
    ); }

function inArray(array, value) {
    for (var i=0; i<array.length; i++) {
        if (array[i] == value) { return true; }
    }
    return false;
}

function updateFrequency(divID) {
	document.getElementById('dailyFreq').className = "notSelected";
	document.getElementById('weeklyFreq').className = "notSelected";
	document.getElementById('monthlyFreq').className = "notSelected";
	document.getElementById(divID).className = "selected";
	frequency = divID.substr(0, 1);
}

function selectRecords(divID) {
	recordDivtoNumber = {'tenRecords': 10, 'hundredRecords': 100, 'thousandRecords': 1000, 'allRecords': 1000000000 }
	document.getElementById('tenRecords').className = "notSelected";
	document.getElementById('hundredRecords').className = "notSelected";
	document.getElementById('thousandRecords').className = "notSelected";
	document.getElementById('allRecords').className = "notSelected";
	document.getElementById(divID).className = "selected";
	recordNumber = recordDivtoNumber[divID];
	renderCharts(data);
};

function downloadJSON2CSV(objArray) {
	var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	var str = 'Date,Open,High,Low,Close,AdjClose,PriorAdjClose,Volume,Ticker\n';

	for (var i=0; i<array.length; i++) {
		var line = '', ln = array[i]
		line += ln.date+','+ln.open+','+ln.high+','+ln.low+','+ln.close+','+ln.adjclose+','+ln.priorClose+','+ln.volume+','+ln.ticker;
		
		line.slice(0,line.Length-1); 
            str += line + '\r\n';
        }
        window.open( "data:text/csv;charset=utf-8," + escape(str))
    }

function addTicker(ticker, recentTickers) {
	ticker = ticker.replace(' ', '');
	ticker = ticker.replace(',', '');
	if (ticker == '') { return null; }
	if (inArray(currentTickers, ticker) == false) { 
		currentTickers.push(ticker); 
		var div = document.getElementById('currentTickers');
  		div.innerHTML = div.innerHTML + '<div onclick="deleteDiv(this)" id=current' + ticker + ' class="TBVtickers">' + ticker + ' x</div>';
  		document.getElementById('tickers').value = '';
	}
	if (inArray(recentTickers, ticker) == false) {
		recentTickers.push(ticker);
		cval = getCookie('recentTickers');
	if (cval == "") { cval = ticker }
	else { cval = cval + ',' + ticker; }
	createCookie('recentTickers', cval);
 	}
}

function buildHistURL(ticker, fromDate, toDate) {
    fromDate = fromDate.toString(), toDate = toDate.toString();
    var fromYear = fromDate.substr(0,4), fromMonth = fromDate.substr(4,2)-1, fromDay = fromDate.substr(6,2)
    var toYear = toDate.substr(0,4), toMonth = toDate.substr(4,2)-1, toDay = toDate.substr(6,2)
    return "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20csv%20where%20url%3D'http%3A%2F%2Fichart.finance.yahoo.com%2Ftable.csv%3Fs%3D" + ticker + "%26d%3D" + toMonth + "%26e%3D" + toDay + "%26f%3D" + toYear + "%26g%3D"+frequency+"%26a%3D" + fromMonth + "%26b%3D" + fromDay + "%26c%3D" + fromYear + "%26ignore%3D.csv'%20and%20columns%3D'Date%2COpen%2CHigh%2CLow%2CClose%2CVolume%2CAdjClose'&format=json&diagnostics=true"
};

function renderHistoricString(historicString) {
	var hDiv = document.getElementById('historicData');
	hDiv.innerHTML = historicString;
}

function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length; }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

function populateSearches() {
	searches = getCookie('Searches')
	if (searches.length == 0) { document.getElementById('searchTitle').innerHTML = ''; }
	else { 
		document.getElementById('searchTitle').innerHTML = '<div style="text-align:center">search history</div>'; 
		searches = searches.split('-');
		searchHTML = '';
		for (var i=0; i<searches.length; i++) {
			searchHTML += '<div class="onHover" onclick="clickSearch(this)" id="search">' + searches[i] + '</div>'; }
		document.getElementById('searches').innerHTML = searchHTML;
		document.getElementById('searches').style.height = Math.min(200, searches.length*20)+'px';
	}
}

function clickSearch(div) {
	Clear();
	var params = div.innerHTML.split(' ');
	var tickers = params[0].split(',');
	var frequency = params[params.length-1];
	var fromDate = '', toDate = '';
	for (var i=1; i<params.length-1; i++) {
		if (params[i].substr(0,4)=='from') {
			fromDate = params[i].substr(5, params[i].length); }
		if (params[i].substr(0,2)=='to') {
			toDate = params[i].substr(3, params[i].length);}
	}
	for (var i=0; i<tickers.length; i++) {
		ticker = tickers[i]; addTicker(ticker, recentTickers);
	}
	getHistoric(fromDate, toDate, tickers, frequency, recentTickers);
}

function setSearchCookie(fromDate, toDate) {
	var freqConv = {'d': 'daily', 'w': 'weekly', 'm': 'monthly'};
	var search = currentTickers.toString();
	if (fromDate!='') { search += ' from=' + fromDate.toString() };
	if (toDate!='') { search += ' to=' + toDate.toString() };
	search += ' frequency=' + freqConv[frequency];
	Searches = getCookie('Searches').split('-');
	searches = search;
	for (var i=0; i<Searches.length; i++) {
		if (Searches[i] != search) { 
			searches += '-' + Searches[i]  }
	}
	createCookie('Searches', searches);
}

function formatArea() {
    document.getElementById('download').style.display = 'inline-block';
    document.getElementById('clear').style.display = 'inline-block';
    var IDs = ['rightColumn', 'download', 'clear', 'Container'];
    for (var i=0; i<IDs.length; i++) {
    	document.getElementById(IDs[i]).style.display = 'inline-block';
        }
    }

function unFormatArea() {
    var IDs = ['rightColumn', 'download', 'clear', 'Container'];
    for (var i=0; i<IDs.length; i++) {
    	document.getElementById(IDs[i]).style.display = 'none'; }
    }

function Clear() {
	unFormatArea();
	currentTickers = [];
	document.getElementById('currentTickers').innerHTML = '';
	document.getElementById('fromDate').innerHTML = '';
	document.getElementById('toDate').innerHTML = '';
	document.getElementById('tickers').innerHTML = '';
	data = '';
}

function validateTickers(cData, currentTickers) {
	var cResults = cData.query.results.row
	for (var j=0; j<currentTickers.length; j++) {
		for (var i=0; i<cResults.length; i++) {
			if (cResults[i].symbol == currentTickers[j]) {
				if (cResults[i].price == '0.00' && cResults[i].change == 'N/A') {
					document.getElementById('current'+currentTickers[j]).style.backgroundColor = '#ff7373';
					currentTickers.splice(j, 1);}
				else { document.getElementById('current'+currentTickers[j]).style.backgroundColor = 'lightGreen'; }
			}
		}
	}
	return currentTickers;
}

function getHistoric(fromDate, toDate, currentTickers, frequency, recentTickers) {
	URL = createURL(recentTickers);
	$.ajaxSetup({async: false});
	updateRecentQuotes(URL);
	$.ajaxSetup({async: true});
	currentTickers = validateTickers(cData, currentTickers)

	if (currentTickers.length == 0) {
		document.getElementById('tickers').style.backgroundColor = '#ff7373';
		document.getElementById('tickers').style.color = 'white';
		document.getElementById('tickers').style.textAlign = 'center';
		document.getElementById('tickers').value = 'enter ticker';
		setTimeout(function() {
      		document.getElementById('tickers').style.backgroundColor = 'white';
      		document.getElementById('tickers').value = '';
      		document.getElementById('tickers').style.color = 'gray';
      		document.getElementById('tickers').style.textAlign = 'left';
      	}, 1000);
	return null; }

    setSearchCookie(fromDate, toDate);
    if (toDate === '') { // Default to today
    	var div = document.getElementById('toDate');
    	div.style.backgroundColor = 'lightGreen'; div.style.color = 'white'; div.style.textAlign = 'center'; div.style.fontSize = '10px'; div.value = 'defaulted: today';
        var today = new Date();
        var year = today.getFullYear().toString(), month = (today.getMonth()+1).toString(), day = today.getDate().toString();
        if (day.length == 1) { today = '0' + today; };
        if (month.length == 1) { month = '0' + month; };
        toDate = year + month + day; }

    if (fromDate === '' ) { // Default to 1 year from start date
    	var div = document.getElementById('fromDate');
    	div.style.backgroundColor = 'lightGreen'; div.style.color = 'white'; div.style.textAlign = 'center'; div.style.fontSize = '10px'; div.value = 'defaulted: 1 year';
        fromDate = (toDate - 10000).toString(); }
    
    var jxhr = [], result = [], urls = [], consolData = [];
    for (var i=0; i<currentTickers.length; i++) {
    	histURL = buildHistURL(currentTickers[i], fromDate, toDate);
    	urls.push(histURL);
    }
    $.each(urls, function(i, url) {
    	jxhr.push($.getJSON(url, function (data) {
    		result[i] = data.query.results; })
    	); })

    $.when.apply($, jxhr).done(function() {
    	for (var i=0; i<result.length; i++) {
    		var Ticker = currentTickers[i], tickerData = result[i].row;
    		for (var j=1; j<tickerData.length; j++) {
    			line = tickerData[j];
    			var newLine = new Object();
    			newLine.date = line['Date'], newLine.open = line.Open, newLine.high = line.High, newLine.low = line.Low, newLine.close = line.Close, newLine.volume = line.Volume, newLine. adjclose = line.AdjClose, newLine.ticker = Ticker
    			consolData.push(newLine);
    		}
    	}
    	var div = document.getElementById('toDate');
    	if (div.value == 'defaulted: today') {
    		div.value = ''; div.style.backgroundColor = 'white'; div.style.color = '#98abc5'; div.style.textAlign = 'left'; div.style.fontSize = '12px';
    	}
    	var div = document.getElementById('fromDate');
    	if (div.value == 'defaulted: 1 year') {
    		div.value = ''; div.style.backgroundColor = 'white'; div.style.color = '#98abc5'; div.style.textAlign = 'left'; div.style.fontSize = '12px';
    	}

    	myJson = consolData;
    	data = JSON.parse(JSON.stringify(myJson));
    	renderCharts(data);
    	formatArea();
    	populateSearches();
    });
}

function updateFrequency(divID) {
	document.getElementById('dailyFreq').className = "notSelected";
	document.getElementById('weeklyFreq').className = "notSelected";
	document.getElementById('monthlyFreq').className = "notSelected";
	document.getElementById(divID).className = "selected";
	frequency = divID.substr(0, 1);
}
