/*====================================
WONDERDIINA PRODUCT PAGE
====================================*/


/*=============
IMAGE GALLERY
=============*/

const heroImage = document.getElementById("hero-image");

const thumbnails = document.querySelectorAll(".thumb");

thumbnails.forEach((thumb)=>{

thumb.addEventListener("click",()=>{

heroImage.src = thumb.src;

thumbnails.forEach((item)=>{

item.classList.remove("active");

});

thumb.classList.add("active");

});

});


/*=============
QUANTITY
=============*/

const minus = document.getElementById("minus");

const plus = document.getElementById("plus");

const qty = document.getElementById("qty");

if(minus && plus && qty){

minus.addEventListener("click",()=>{

let value=parseInt(qty.value);

if(value>1){

qty.value=value-1;

}

});

plus.addEventListener("click",()=>{

let value=parseInt(qty.value);

qty.value=value+1;

});

}


/*====================
PERSONALIZATION
====================*/

const customName=document.getElementById("customName");

const nameInput=document.getElementById("nameInput");

if(customName && nameInput){

nameInput.style.display="none";

customName.addEventListener("change",()=>{

if(customName.checked){

nameInput.style.display="block";

nameInput.focus();

}else{

nameInput.style.display="none";

nameInput.value="";

}

});

}


/*====================
ADD TO CART
====================*/

const addCart=document.querySelector(".add-cart");

if(addCart){

addCart.addEventListener("click",()=>{

const quantity=qty ? qty.value : 1;

const personalized=customName && customName.checked;

const customerName=nameInput ? nameInput.value : "";

let total=90;

if(personalized){

total+=30;

}

total=total*quantity;

alert(

"Added to cart\n\n"+

"Quantity : "+quantity+

"\nPersonalized : "+(personalized?"Yes":"No")+

"\nName : "+customerName+

"\n\nTotal : "+total+" MAD"

);

});

}


/*====================
WHATSAPP MESSAGE
====================*/

const whatsapp=document.querySelector(".whatsapp");

if(whatsapp){

whatsapp.addEventListener("click",(e)=>{

e.preventDefault();

const quantity=qty ? qty.value : 1;

const personalized=customName && customName.checked;

const customerName=nameInput ? nameInput.value : "";

let message="Hello WonderDiina!%0A%0A";

message+="I would like to order:%0A";

message+="Lavender Bloom Glass Tumbler%0A";

message+="Quantity: "+quantity+"%0A";

if(personalized){

message+="Personalization: Yes%0A";

message+="Name: "+customerName+"%0A";

}else{

message+="Personalization: No%0A";

}

window.open(

"https://wa.me/212600499120?text="+message,

"_blank"

);

});

}