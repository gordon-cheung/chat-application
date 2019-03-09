function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

exports.generateName = function() {
  var nameList = ['Captain America', 'Superman', 'Black Panther', 'Iron Man', 'Thor', 'Black Widow', 'Hulk', 'Shuri', 'Okoye', 'Ant-Man', 'Wasp', 'Dr.Strange', 'Winter Soldier', 'Hawkeye', 'Falcon', 'Vision', 'Nick Fury', 'Ultron', 'Red Skull', 'Loki']

	var name = nameList[getRandomInt(nameList.length)]
	return name;
}

exports.generateHexColor = function() {
  var hexList = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"]

  var hexColorCode = "#"
  for(i=0; i<=5;i++) {
    hexColorCode += hexList[getRandomInt(hexList.length)]
  }
  return hexColorCode
}
