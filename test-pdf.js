import { jsPDF } from "jspdf";
const doc = new jsPDF();
doc.text("Hello world!", 10, 10);
const out = doc.output('bloburl');
console.log(typeof out);
