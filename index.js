const fetch = require('node-fetch');
const nodemailer = require("nodemailer");
 
const today =  () => {
	const d = new Date();
	return ("0" + d.getDate()).slice(-2) + "-" + ("0" + d.getMonth()).slice(-2) + "-" + d.getFullYear();
}


const checkCowin = () => 
	fetch('https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=571&date='+today(), {
		method: 'GET',
		headers: {
			"accept": "application/json, text/plain, */*",
		    "accept-language": "en-IN,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
		    "authorization": process.env.TOKEN,
		    "cache-control": "no-cache",
		    "pragma": "no-cache",
		    "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
		    "sec-ch-ua-mobile": "?0",
		    "sec-fetch-dest": "empty",
		    "sec-fetch-mode": "cors",
		    "sec-fetch-site": "cross-site"
		},
		referrer: "https://selfregistration.cowin.gov.in/",
  		referrerPolicy: "strict-origin-when-cross-origin",
  		"body": null,
  		"mode": "cors"
	})
	.then( response => response.text())

const fetchAvailable = (data) => {
	console.log(">>>>>>>>>>",data)
	return data.centers.filter(x => x.sessions.some( y => y.min_age_limit === 18 && y.available_capacity > 0) )	
}


const keepFetching = () => checkCowin()
				.then( data =>  new Promise((resolve, reject) => {
					var json = {centers: []}
					try{
						json = JSON.parse(data)	
					}catch(e){
						reject(new Error("Error parsing JSON:" + e.message + data))
					}
					resolve(fetchAvailable(data))	
				}))


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_ID, // generated ethereal user
      pass: process.env.PASSWORD, // generated ethereal password
    },
  });


const sendMail  = (data) => 
	transporter.sendMail({				
				    from: process.env.EMAIL_ID, // sender address
				    to: process.env.RECEPIENTS, // list of receivers
				    subject: "COWIN Alert - 18+ available Now !!!", // Subject line
				    html: "<b>COWNIN Available in the following Locations</b><ul>" + data.map(x => "<li>"+x.name+":"+x.address+"</li>")+"</ul>"
				  })


const sendErrorMail  = (e) => 
	transporter.sendMail({				
				    from: process.env.EMAIL_ID, // sender address
				    to: process.env.ERROR_RECEPIENTS, // list of receivers
				    subject: "Application Error Check", // Subject line
				    html: "<b>ERROR CHECK IT</b><p>"+ e.message + "</p>"
				  })	


const notifyIfAny = () => 
keepFetching().then(data => {
				if(data.length > 0){
					console.log(data);
					sendMail(data)
				} }
	)
	.catch(error => sendErrorMail(error))


// console.log(today())
// notifyIfAny()
setInterval(notifyIfAny, process.env.FREQUENCY ||  300000);
