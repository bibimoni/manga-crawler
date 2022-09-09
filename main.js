//for the main thread    

const { By, Key, Builder } = require('selenium-webdriver');
require('chromedriver')
const chromeDriver = require("selenium-webdriver/chrome");
const webdriver = require("selenium-webdriver");
const axios = require('axios');
const cheerio = require('cheerio');
const url = 'https://otakusan.net/manga-detail/76911/chong-yeu-em-muon-dinh-cong';
const chapter_url = 'https://otakusan.net/chapter/';
const chapid_element = '.table.mdi-table.table-clickable-td > tbody > tr';
const fs = require('fs');
const https = require('https')
const default_directory = "E:\\download\\";
const folderName = `${default_directory}chong-yeu-em-muon-dinh-cong`
const download = require('download');
const chapter = 1;

//get every chapter id 
//returns a promise that resolves chapter id as an array
const Main = async () => {
    createFolder(folderName);

    let res = await fetchData(url);
    if(!res.data) {
        console.log('invalid data object');
        return;
    }
    const html = res.data;
    
    //mount html page to the root element
    const $ = cheerio.load(html); 
    const chaptersData = $(chapid_element)
        //get the data-chapid attribute from tr element in the table, returns all in an array
        .map((i, x) => $(x).attr('data-chapid')).toArray();
    
    return chaptersData.reverse(); // the first chapter will the the last element in the array
}

async function fetchData(url) {
    console.log('crawling...') 
    //make http call to url
    let response = await axios(url)
        .catch((err) => {
            console.log(err);
        })
    // if failed
    if(response.status !== 200) {
        console.log('an error occurred code: ' + response.status);
        return;
    }
    return response;
}

//get image from chapter
Main().then(async chapters => {

    //create folder
    const folder = `${folderName}\\chapter ${chapter}`
    createFolder(folder)
    
    const url = `${chapter_url}${chapters[chapter - 1]}`
    //setup chrome
    let options = new chromeDriver.Options();
    options.setUserPreferences({
        "download.default_directory": default_directory
    })
    
    //to wait for browser to build and launch properly
    let driver = new webdriver.Builder()
        .withCapabilities(webdriver.Capabilities.chrome())
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();
    
    try {
        await driver.get(url);
        
        //wait for driver to fully initialized
        await driver.sleep(3000);
        
        const getImage = async () => {
            let count = 1;       
            let elements = await driver.findElements(By.className('image-wraper'));
            let size = elements.length;
            size = size - 1; // remove 1 ad
            while(count <= size) {
                let path = `//*[@id="rendering"]/div[${count}]/img`
                try {
                    let img = await driver.findElement(By.xpath(path));
                    let src = await img.getAttribute('src');
                    download(src, `${folder}`)
                    console.log('download completed')
                }
                catch(e) {
                    console.log('element not found')
                }
                count++;
            }
        }
        
        getImage();   
        //Wait for 5s till download is completed
        await driver.sleep(5000);
    }
    catch(e) {
        console.log("an error occurred ", e)
    }
    await driver.quit();
    await openDirectory(folder);
    
})

function createFolder(directory) {
    try {
        if(!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }
    }
    catch (err) {
        console.log(err);
    }
}


async function openDirectory(directory) {
    fs.opendir(
    
        // Path of the directory
        directory,
        
        // Options for modifying the operation
        { encoding: "utf8", bufferSize: 64 },
        
        // Callback with the error and returned
        // directory
        (err, dir) => {
            if (err) console.log("Error:", err);
            else {
            // Print the pathname of the directory
            console.log("Path of the directory:", dir.path);
            }
        }
    );
}