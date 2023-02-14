const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3351;

app.use(express.json());
app.use(cors({
  origin: '*'
}));

app.delete('/contact/:contact', async (req, res) => {

  const { contact } = req.params;
  let contacts = await getAllContacts();
  contacts.splice(contacts.indexOf(contact), 1);
  fs.writeFileSync('contacts.json', JSON.stringify(contacts));
  res.send(`Deleted contact "${contact}"`);

});

app.post('/contact/:contact', async (req, res) => {
  let contacts = await getAllContacts();
  const { contact } = req.params;
  contacts.push(contact);
  console.log(contacts);
  fs.writeFileSync('contacts.json', JSON.stringify(contacts));
  res.send(`Successfully added "${contact}"`);
});

app.get('/contact', async (req, res) => {
  let contacts = await getAllContacts();
  res.send(JSON.stringify(contacts));
});


module.exports = app.listen(port, () => {
  console.log(`Contacts apis are running at http://localhost:${port}`);
});


async function getAllContacts() {
  return new Promise((resolve, reject) => {
    fs.readFile("contacts.json", "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  });
}
