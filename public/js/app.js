$(document).ready(function() {



    // get the checked symptoms from checklist.ejs 
    $('.symptoms').submit(function(e) {
        e.preventDefault();
        var $form = $(this), // rename form? 
            inputs = $form.find("input"),
            arr = [];

        for (var i = 0, max = inputs.length; i < max; i += 1) {
            // Take only those inputs which are checkbox
            if (inputs[i].type === "checkbox" && inputs[i].checked) {
                arr.push(inputs[i].value);
            }
        }

    });

    // display today's fitbit data

    // what is the inciting incident that displays todays data? $('.').submit(function(event) {
       // event.preventdefault();
       // $(".fitbitresults").append("Date: " today + <br>"Calories: " + calories + <br>"Distance: " + distance + <br>"Steps: " + steps);
    //}

    // Display past days

   // $('.viewData').submit(function(event) {
    //    event.preventDefault();
//  $.each(function() {
                       //    $(".pastDays").append("Date: " dailylist.date + <br>"Calories: " + fitbit.calories + <br>"Distance: " + fitbit.distance + <br>"Steps: " + fitbit.steps + <br>"Mental Health Symptoms: " + dailylist.symptoms);


//});
