// Assumes 3 channel image
function histEqualizeColor(im){
    console.time("mainloop")
    // Divide into color channels
    tmp = im.split(3, 2);

    let red = histEqualize(tmp[0]);
    let green = histEqualize(tmp[1]);
    let blue = histEqualize(tmp[2]);

    tmp = tf.stack([red, green, blue],2).squeeze();
//    console.log("output shape from histequalize", tmp.shape);
    console.timeEnd("mainloop")
    return tmp
}

// Assumes single channel image
function histEqualize(im){
//    im.print()
//    console.time("singlecolor")
    let imArray = im.flatten().arraySync();
    let LUT = getCDFLUT(imArray)

    newIm = imArray.map(elem => LUT[elem]);
    newIm = tf.tensor(newIm,[128,128,1]);

//    console.time("singlecolor")
    return newIm
}

// Assumes single channel image
function getCDFLUT(flatIm){
    hist = getHist(flatIm);

    // Cut out the zeros on either size
    smallIndex = Math.min(...flatIm);
    bigIndex = Math.max(...flatIm) + 1;
    distrofunction = hist.slice(smallIndex, bigIndex);

    // Cumulative-sum the distribution
    cdf = []
    acc = 0;
    distrofunction.forEach(elem => {
        acc += elem;
        cdf.push(acc);
    })

    // Since it's sorted, we can get the minimum CDF and # pixels from the cdf itself
    cdfMin = cdf[0];
    MN = cdf[bigIndex-smallIndex-1];
    invMN = 1/(MN-cdfMin);
    L = 256 - 2;
    let newLUT = new Object();

    // Create the lookup table for histogram equalizing
    for (let i = smallIndex; i < (bigIndex); i++){
        newLUT[i] = Math.round((cdf[i-smallIndex]-cdfMin) * invMN * L);
//        console.log(i, cdf[i])
    }

    return newLUT;
}

function getHist(flatIm){
    let hist = [];
    for (let i = 0; i < 256; i++){
        hist.push(0)
    }
    flatIm.forEach(elem => hist[elem] += 1)
    return hist;
}
