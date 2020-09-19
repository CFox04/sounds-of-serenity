// Shuffles an array
Array.prototype.shuffle = function() {
    this.sort(() => Math.random() - 0.5);
}

// Formats a file name into something more presentable (removes hyphens, capatalizes letters, and removes file extension)
function formatName(string) {
    string = string.replace('-', ' ');
    string = string.replace(/\.wav|\.mp3/, '');
    // Capatalize letters
    var splitStr = string.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        // You do not need to check if i is larger than splitStr length, as your for does that for you
        // Assign it back to the array
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
    // Directly return the joined string
    return splitStr.join(' '); 
}

// function capatalizeFirstLetter(string) {
//     return string.charAt(0).toUpperCase() + string.slice(1);
// }

// Cycles icon image to either selected or not selected
function cycleImage(element) {
    // Extract name of image from src attribute
    let src = $(element).attr('src')
    let dirName = 'static/assets/'
    var imageName = src.slice(src.indexOf(dirName) + dirName.length, src.length).replace('.svg', '')

    // Determine if the image is a selected or unselected variant
    if (imageName.search('-selected') != -1) {
        imageName = imageName.replace('-selected', '')
        $(element).removeClass('selected')
    }
    else {
        imageName = imageName.concat('-selected')
        $(element).addClass('selected')
    }

    // Set the image src accordingly
    $(element).attr('src', `${dirName}/${imageName}.svg`)
}

// Recursively searches a directory for a specified file
function findFile(fileName, dir) {
    var directories = [];
    for (i in dir) {
        let entry = dir[i];

        // If entry is a dictionary, unpack into array
        if (entry.constructor == Object) {
            // If the file being searched for is itself a directory, then search the dictionary for a directory with the name of fileName
            if (Object.keys(entry).indexOf(fileName) != -1) {
                return Object.values(entry);
            }
            entry = Object.values(entry);
        }

        // If entry is an array (meaning it is the inside of a directory)
        if (Array.isArray(entry)) {
            directories.push(entry);
        }
        else if (entry == fileName) {
            return entry;
        }

        // If item is the last item in directory and no files have matched, begin to search each of the sub-directories
        if (i == dir.length - 1) {
            for (directory of directories) {
                var file = findFile(fileName, directory)
                if (file) {
                    return file;
                }
            }
        }
    }
    return false;
}