declare var $;

function createOrder() {
  var order = {
    value: Math.round(Math.random() * 100)
  }
  //var order = 'funny+cat'

  return order;
}

function createMail() {
  var mail = 'user_' + Math.round((Math.random() * 100)) + '@gmail.com'
  return mail;
}


function getCapabilities(wpsurl) {
  var wpsparams = `Service=WPS&Request=GetCapabilities&Version=1.0.0`;

  var query = encodeURIComponent(`${wpsurl}?${wpsparams}`)
  $.get(`http://localhost:3000/WPS/GetCapabilities?url=${query}`, (data, status) => {
    console.log(status);
    console.log(data);
  });
}

function describeProcess(wpsurl, identifier) {
  var wpsparams = `Service=WPS&Request=DescribeProcess&Version=1.0.0&Identifier=${identifier}`;

  var query = encodeURIComponent(`${wpsurl}?${wpsparams}`)
  $.get(`http://localhost:3000/WPS/DescribeProcess?url=${query}`, (data, status) => {
    console.log(status);
    console.log(data);
  });
}

function execute(wpsurl, body) {
  /*
    var wpsparams = `?Service=WPS&
    Request=Execute&
    Version=1.0.0`;
    var query = encodeURIComponent(`${wpsurl}?${wpsparams}`)
  */
  var query = encodeURIComponent(wpsurl)
  $.ajax({
    type: "POST",
    url: `http://localhost:3000/WPS/Execute?url=${query}`,
    data: body,
    contentType: "application/json",
    dataType: 'json',
    success: (data, status) => {
      console.log(status);
      console.log(data);
    }
  });
}


$(document).ready(function() {
  var wpsurl = $('#txt_url').val();
  $("#GetCapabilities").click(function() {
    wpsurl = $('#txt_url').val();
    getCapabilities(wpsurl);

  });

  $("#DescribeProcess").click(function() {
    var identifier = $('#txt_identifier').val();
    describeProcess(wpsurl, identifier)
  });

  $("#Execute").click(function() {
    var value = $('#txt_body').val().replace(/\s/g, '');
    var body = {
      email: createMail(),
      executeBody: JSON.parse(value)
    }
    console.log(value)
    execute(wpsurl, JSON.stringify(body));
  });

});
