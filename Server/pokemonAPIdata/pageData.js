// in here i will call all the functions that are in pokemonAPIcalls and store the data returned in variables here
const pokemonAPI = require('./pokemonAPIcalls.js');

const ability_url = 'https://pokeapi.co/api/v2/ability/?limit=1000';
const type_url = 'https://pokeapi.co/api/v2/type/?limit=1000';

// These will be filled asynchronously and exported after loading

let idList = [];
let typeList = [];
let abilityList = [];

async function loadAllData() {
  idList = await pokemonAPI.getAllPokemonIDs();
  typeList = await pokemonAPI.loadAsyncDataUsingFetch([], type_url);
  abilityList = await pokemonAPI.loadAsyncDataUsingFetch([], ability_url);
}

// Immediately start loading data
loadAllData();

const welcomePageData = {
  explanation: "Welcome to the Pokémon Gallery! \n Enjoy your journey through the world of Pokémon!",
  author: "Developed by Rotem Levi, 318845310"
};

function isValidElement(id, type, ability) {
  return (idList.includes(Number(id)) || !id || id === "null") &&
         (typeList.includes(type) || !type || type === "null") &&
         (abilityList.includes(ability) || !ability || ability === "null");
}

module.exports = {
  get idList() { return idList; },
  get typeList() { return typeList; },
  get abilityList() { return abilityList; },
  welcomePageData,
  isValidElement
};


