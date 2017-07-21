if (window.File && window.FileReader && window.FileList && window.Blob) {
    document.getElementById('file').addEventListener('change', function(e) {
      //    input[type=file]   multiple,    
     //  ,   e.target.files     
      var file = e.target.files[0];
      //            
      var output = document.getElementById('ram');
      var reader = new FileReader();
      //    onload.      
      reader.onload = function(e) {
          // e.target.result    
          var text = e.target.result;
        
          output.value= '';
		  var out = '';
          for (var i = 0; i < text.length; i++) {
			  if(text.charCodeAt(i)>0xF)
				out +='0x' + text.charCodeAt(i).toString(16) + ',  ';
			  else
				out +='0x0' + text.charCodeAt(i).toString(16) + ',  '; 
          }
		  out +='0x90'
		  output.value = out;
		  load(text);
      };
      reader.readAsBinaryString(file);
    });
} else {
    alert('File API is not supported!');
}

var out = document.getElementById("output");
var input = document.getElementById("input");
var ctx = out.getContext("2d");
var outDebug = document.getElementById("debug");
var codePreviev = document.getElementById("codePreviev");
var arrPrevious = [];
ctx.font = "14px Sans";
ctx.textAlign="start";
ctx.textBaseline="top";
ctx.fillStyle = "#000000";
ctx.fillRect(0,0,640,400);
var textX = 0;
var textY = 0;
var keypressed = 0;
var com;

function compiletocom(){
	var s=[];
	var str = input.value;
	printError(0);
	s=parser.pars(str)
	com = compiler.compile(s);
	printError(1);
	load(com);
	var out = '';
	for (var i = 0; i < com.length; i++) {
	  if(com.charCodeAt(i)>0xF)
		out +='0x' + com.charCodeAt(i).toString(16) + ', ';
	  else
		out +='0x0' + com.charCodeAt(i).toString(16) + ', '; 
	}
	out +='0x90';
	document.getElementById('ram').value = out;
}

function savecom(){
	var newByteArr=[];
	if(com.length>1){
		for(var i=0;i<com.length;i++){
			newByteArr.push(com.charCodeAt(i)&0xFF);
		}
		var newFile=new Uint8Array(newByteArr);
		var blob = new Blob([newFile], {type: "charset=iso-8859-1"});
		saveAs(blob, "rom.com");
	}
}

function handle(e) {
	if(keypressed>0){
		ip = keypressed;
		keypressed = 0;
		var key = e.keyCode & 0xff;
		regs.byteregs[regal] = key;
		notInput = true;
	}
}

input.onclick = input.onkeydown = input.onkeyup = input.onkeypress = inputOnKey;

var functionArray = [
	'print(<b>int</b>);','print(<b>string</b>);','printc(<b>char</b>);',
	'input(); <i>ret</i> <b>int</b>','inputc(); <i>ret</i> <b>char</b>',
	'if(<b>int</b>){} <i>0 false, else true</i>',
	'while(<b>int</b>){} <i>repeat if true (0 false, else true)</i>',
	'goto(<b>label</b>)'
]

function inputOnKey(e){
	var position = getCaretPos(input);
	var str = input.value;
	var left = 0;
	var right = str.length;
	var word;
	var out = ':';
	for(var i = position; i >= 0 ; i--){
		if(' \n\r\t({[]});'.indexOf(str[i]) > -1){
			left = i + 1;
			break;
		}
	}
	for(i = position; i < str.length; i++){
		if(' \n\r\t({[]});'.indexOf(str[i]) > -1){
			right = i;
			break;
		}
	}
	if(left < right){
		word = str.substring(left,right);
		out += word + ': ';
		var oBracket = word.indexOf('(');
		if(oBracket >-1 )
			word = word.substring(0, oBracket);
		for(i = 0; i < functionArray.length; i++){
			if(functionArray[i].indexOf(word) == 0)
				out += functionArray[i] + ' ';
		}
	}
	document.getElementById("hint").innerHTML = out;
}

function getCaretPos(obj) {
  obj.focus();
  if (document.selection) { // IE
    var sel = document.selection.createRange();
    var clone = sel.duplicate();
    sel.collapse(true);
    clone.moveToElementText(obj);
    clone.setEndPoint('EndToEnd', sel);
    return clone.text.length;
  } else if (obj.selectionStart!==false) return obj.selectionStart; // Gecko
  else return 0;
}

var cgaColors = [
	"#000000","#0000AA","#00AA00","#00AAAA",
	"#AA0000","#AA00AA","#AA5500","#AAAAAA",
	"#555555","#5555FF","#55FF55","#55FFFF",
	"#FF5555","#FF55FF","#FFFF55","#FFFFFF"
]

function clearScreen(){
	ctx.fillStyle = "#000000";
	ctx.fillRect(0,0,640,400);
	textX = 0;
	textY = 0;
}

function print(s ,color ){
	if(color === undefined || videomod == 0 || videomod == 2){
		textColor = "#FFFFFF";
		backgroundColor = "#000000";
	}
	else{
		textColor = cgaColors[color & 0xf];
		backgroundColor = cgaColors[(color >> 4) & 0xf];
	}
	for(var i = 0; i < s.length; i++){	
		if(s.charCodeAt(i) == 8){ //backspace
			textX--;
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(textX * 16,textY * 16, 16, 16);
		}
		else if(s.charCodeAt(i) == 10){ //new string
			textY++;
		}
		else if(s.charCodeAt(i) == 13){ //new string
			textX = 0;
		}
		else{
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(textX * 16,textY * 16, 16, 16);
			ctx.fillStyle = textColor;
			ctx.fillText(s[i],textX * 16,textY * 16);
			textX++;
			if(textX + i >= 40){
				textX = 0;
				textY++;
				if(textY >= 24){
					var imgData = ctx.getImageData(0,0,640,400);
					ctx.fillStyle = "#000000";
					ctx.fillRect(0,0,640,400);
					ctx.putImageData(imgData, 0, -16);
					textY = 23;
				}
			}
		}
	}
}

function printChange(num, name, pos){
	var out = '';
	var d  = '<div>';
	var dc = '<div class="change">';
	var e  = '</div>';
	if(arrPrevious[pos] == num){
		out+=(e + d + name + ': ');
	}
	else{
		out+=(e + dc + name + ': ');
		arrPrevious[pos] = num;
	}
	out+=(num.toString(16));
	return out;
}

function debug(){
	var i = 0;
	var clm1 = '<div class="column">';
	var clm2 = '<div class="column">';
	var clm3 = '<div class="column">';
	var clm4 = '<div class="column">';
	var out = '<div>';
	
	out += printChange(regs.wordregs[regax], 'ax', i++);
	out += printChange(regs.wordregs[regbx], 'bx', i++);
	out += printChange(regs.wordregs[regcx], 'cx', i++);
	out += printChange(regs.wordregs[regdx], 'dx', i++);
	out += printChange(segregs[regcs], 'cs', i++);
	out += printChange(firstip, 'ip', i++);
	out += printChange(segregs[regss], 'ss', i++);
	out += printChange(regs.wordregs[regsp], 'sp', i++);
	out += printChange(regs.wordregs[regbp], 'bp', i++);
	out += printChange(regs.wordregs[regsi], 'si', i++);
	out += printChange(segregs[reges], 'es', i++);
	out += printChange(segregs[regds], 'ds', i++);
	
	out+='</div>';
	
    out+=(opcode.toString(16));
	out+=("<br>flags:<br>czsopaid<br>");
	out+="" + cf + zf + sf + ofl + pf + af + ifl + df;
	
	outDebug.innerHTML = out;
	
	var adr = (segregs[regcs] << 4) + firstip;
	var lastip = ip - firstip - 1;
	if(lastip>2)
		lastip=0;
	if(lastip<0)
		lastip=0;
	for(var i=0; i<20; i++){
		var mem = RAM[adr-10+i-0x7100];
		if(i >= 10 && i <= lastip + 10){
			clm1 += '<div class="thisip">';
			clm2 += '<div class="thisip">';
			clm3 += '<div class="thisip">';
			clm4 += '<div class="thisip">';
		}
		if(mem !== undefined){
			clm1 += (adr - 10 + i).toString(16);
			clm1 += '<br>';
			clm2 += '0x';
			clm2 += mem.toString(16);
			clm2 += '<br>';
			clm3 += mem;
			clm3 += '<br>';
			clm4 += String.fromCharCode(mem);
			clm4 += '<br>';
		}
		if(i >= 10 && i <= lastip + 10){
			clm1 += '</div>';
			clm2 += '</div>';
			clm3 += '</div>';
			clm4 += '</div>';
		}
	}
	codePreviev.innerHTML = clm1+'</div>'+clm2+'</div>'+clm3+'</div>'+clm4+'</div>';
}

function printError(error, n){
	var out = document.getElementById("alert");
	switch(error){
		case 0:
			out.innerHTML = 'start compilation<br>';
			break;
		case 1:
			out.innerHTML += 'end compilation<br>length ' + com.length + ' byte<br>';
			break;
		case 2:
			out.innerHTML += 'wrong number of brackets<br>';
			break;
		case 3:
			out.innerHTML += 'variable with name ' + n + ' is not declared<br>';
			break;
		case 4:
			out.innerHTML += 'wrong number of braces<br>';
			break;
		case 5:
			out.innerHTML += 'ram use ' + n + ' byte<br>';
			break;
	}
}

function loadFromTextArea(){
	var ram = document.getElementById('ram').value;
	ram = ram.replace(/ /g,"");
	ram = ram.replace(/0x/g,"");
	ram = ram.replace(/0X/g,"");
	ram = ram.replace(/\n/g,"");
	var prog = ram.split(',');
	init86();
	for (var i = 0; i < 65535; i++) {
             RAM[i] = 0x90;
         }
	for(var i = 0;i < prog.length;i++){
		RAM[i] = parseInt(prog[i], 16) & 0xFF;
	}
	document.getElementById('ram').value = '';
	ram = '';
	  for (var i = 0; i < prog.length; i++) {
		  if(parseInt(prog[i], 16)>0xF)
			ram +='0x' + (parseInt(prog[i], 16) & 0xFF) .toString(16)+ ',  ';
		  else
			ram +='0x0' + (parseInt(prog[i], 16) & 0xFF).toString(16) + ',  '; 
	  }
	ram =  ram.substring(0, ram.length - 3);
	document.getElementById('ram').value = ram;
	
}

function load(program){
	init86();
	var i;
	//clean RAM
	for (i = 0; i < 65535; i++) {
             RAM[i] = 0x90;
         }	
	for (i = 0; i < program.length; i++) {
		RAM[i] = program.charCodeAt(i);
	}
}
