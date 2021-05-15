const fetch = require('node-fetch');
const nodemailer = require("nodemailer");
 
const today =  () => {
	const d = new Date();
	return ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth()+1)).slice(-2) + "-" + d.getFullYear();
}


const checkCowin = () => {
	const url = 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=571&date='+today();
	console.log(new Date(), "Trying to fetch data from Cowin", url);
	return fetch(url , {
		headers: {
			"user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36"
		},
		"method": "GET"
		}
	 )
	.then( response => response.json())
}

const fetchAvailable = (data) => {
	return data.centers.filter(x => x.sessions.some( y => y.min_age_limit === 18 && y.available_capacity > 0) )	
}


const keepFetching = () => checkCowin()
				.then( data =>  new Promise((resolve, reject) => {
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
					console.log("has data: ", data);
					sendMail(data)
				} }
	)
	.catch(error => sendErrorMail(error))

setInterval(notifyIfAny, process.env.FREQUENCY ||  300000);

// keepFetching()
