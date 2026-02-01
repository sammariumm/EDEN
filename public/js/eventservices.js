function toggle(){
    var blur = document.getElementById('blur');
    blur.classList.toggle('active');
    console.log(blur);

    var popup = document.getElementById('popup');
    popup.classList.toggle('active');
    console.log(popup);

    var blur1 = document.getElementById('blur1');
    blur1.classList.toggle('active');
    console.log(blur1);

    var blur2 = document.getElementById('blur2');
    blur2.classList.toggle('active');
    console.log(blur2);

    var blur3 = document.getElementById('blur3');
    blur3.classList.toggle('active');
    console.log(blur3);
}

document.addEventListener('DOMContentLoaded', function() {
    const selection = document.getElementById('selection');
    selection.addEventListener('change', updateImage);
    
    function updateImage() {
      const selectedValue = selection.value;
      const image = document.getElementById('previewImage');
      
      if (selectedValue === 'Gender Reveal') {
        image.src = './uploads/Gender_Reveal_Event.jpg';
      } else if (selectedValue === 'Baptismal') {
        image.src = './uploads/Baptismal_Event.jpg'; // Replace with actual path
      } else if (selectedValue === 'Debut') {
        image.src = './uploads/Debut_Event.webp'; // Replace with actual path
      } else if (selectedValue === 'Graduation Ball') {
        image.src = './uploads/Graduation_Ball.jpg'; // Replace with actual path
      } else if (selectedValue === 'Outdoor Weddings') {
        image.src = './uploads/Outdoor_Wedding.jpg'; // Replace with actual path
      } else if (selectedValue === 'Beach Weddings') {
        image.src = './uploads/Beach_Wedding.jpg'; // Replace with actual path
      } else if (selectedValue === 'Anniversaries') {
        image.src = './uploads/Anniversary_Event.jpg'; // Replace with actual path
      } else if (selectedValue === 'Funerals') {
        image.src = './uploads/Funeral_Event.jpeg'; // Replace with actual path
      } else if (selectedValue === 'Birthday Party') {
        image.src = './uploads/Birthday_Party.jpg'; // Replace with actual path
      } else if (selectedValue === 'Welcome Party') {
        image.src = './uploads/Welcome_Party.webp'; // Replace with actual path
      } else if (selectedValue === 'Mothers Day') {
        image.src = './uploads/Mothers_Day.jpg'; // Replace with actual path
      } else if (selectedValue === 'Fathers Day') {
        image.src = './uploads/Fathers_Day.png'; // Replace with actual path
      } else if (selectedValue === 'default') {
        image.src = './uploads/event_reservation_preview.png'; // Replace with actual path
      } else {
        image.src = './uploads/event_reservation_preview.png'; // Default image
      }
    }
  });

  function sendMail() {

    let parms = {
      selection : document.getElementById("selection").value,
      selection_package : document.getElementById("selection_package").value,
      name : document.getElementById("name").value,
      contact_number : document.getElementById("contact_number").value,
      date : document.getElementById("date").value,
      time : document.getElementById("time").value,
      location_venue : document.getElementById("location_venue").value,
      attendees : document.getElementById("attendees").value,
      special_request : document.getElementById("special_request").value,
      email : document.getElementById("email").value,
    }
    emailjs.send("service_hlabdx8","template_wzdrpyj",parms).then(alert("Please check your E-mail."))
  }