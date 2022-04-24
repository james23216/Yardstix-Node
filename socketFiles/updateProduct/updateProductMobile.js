var socket = io.connect('http://localhost:3000');

socket.on('updateProduct', function(data){
    name.innerHtml = data.name;
    arabic_name.innerHtml = data.arabic_name;
    description.innerHtml = data.description;
    arabic_description.innerHtml = data.arabic_description;
    model = data.model;
});