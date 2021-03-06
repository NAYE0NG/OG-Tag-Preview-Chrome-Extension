/* 
    [version : 1.0]
    Content Scripts, background script 없이 현재 탭의 링크 받아오기 
    링크의 dom객체를 한번에 받아와서 meta태그 중 og태그를 파싱하여 배열로 저장 
    popup.html에 og태그 출력

    [version : 2.0]
    Naver 서비스의 최적화된 미리보기 제공
    익스텐션 자체에서 url 검색기능 추가

    [version : 3.0]
    (선택) Facebook,Naver,Twitter 등 각 서비스별로 최적화된 미리보기 제공

*/

var xhr;
var url;
var show_btn;

// 현재 탭의 링크 받기 
function getCurrentTabUrl(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function (tabs) {
        var tab = tabs[0];
        url = tab.url;

        callback(url);

    });
}

// 해딩 URL의 객체들 받아오기 
function parse(html) {
    var el = document.createElement('div');
    el.innerHTML = html;

    // 파싱 
    try {
        var title = el.querySelector('meta[property="og:title"]').getAttribute('content');
    } catch{
        //facebook과 naver의 경우, title 태그 찾기
        try {
            var title = el.querySelector('title').innerText;
        } catch{
            var title = 'og:title및 title태그가 존재하지 않습니다.';
        }
    }
    try {
        var og_url = el.querySelector('meta[property="og:url"]').getAttribute('content');


    } catch{
        //og:url이 없다면, 현재탭의 url할당
        var og_url = url;
    }
    try {
        var description = el.querySelector('meta[property="og:description"]').getAttribute('content');
    } catch{
        //description생략시 뭘 가져올까?...  h1태그? > h2 > h3 > p 순인가??
        var description = 'og:description이 존재하지 않습니다.';
    }
    try {
        var imgSrc = el.querySelector('meta[property="og:image"]').getAttribute('content');
        //이미지의 url이 경로로 나와있는 경우, url 유효성검사
        var checkURL = checkImgUrl(imgSrc);

        if (!checkURL) imgSrc = url + imgSrc;

        //여기서 이미지 태그에 이미지 넣고 원본 이미지 크기 가져오기
        var img = document.createElement("img");
        img.setAttribute("src", imgSrc);
        img.onload = function () {
            var imgWidth = this.naturalWidth;

            if (imgWidth >= 450) {
                document.querySelector('#rect_box').style.display = "block"
                document.querySelector('#rect_img').appendChild(img);
                // text 넣기 
                document.querySelectorAll('.n_title')[1].innerText = title;
                document.querySelectorAll('.n_description')[1].innerText = description;
                document.querySelectorAll('.n_url')[1].innerText = url.split('/')[2];

            } else {
                document.querySelector('#square_box').style.display = "block";
                document.querySelector('#square_img').appendChild(img);
                // text 넣기 
                document.querySelector('.n_title').innerText = title;
                document.querySelector('.n_description').innerText = description;
                document.querySelector('.n_url').innerText = url.split('/')[2];
            }
        }

    } catch{
        //facebook, naver둘다 이미지 없으면 안보여줌
        document.querySelector('#square_img').style.display = "none";
        document.querySelector('#square_txt_outter').style.width = '100%';

        document.querySelector('#square_box').style.display = "block";

        // text 넣기 
        document.querySelector('.n_title').innerText = title;
        document.querySelector('.n_description').innerText = description;
        document.querySelector('.n_url').innerText = url.split('/')[2];

    }

    document.querySelector('#og_title').innerText = title;
    document.querySelector('#og_url').innerText = og_url;
    document.querySelector('#og_description').innerText = description;
    document.querySelector('#og_image').innerHTML = "<img src='" + imgSrc + "'>";

}

//imgURL유효성검사
function checkImgUrl(strUrl) {
    var expUrl = /(http(s)?:\/\/)([a-z0-9\w]+\.*)+[a-z0-9]{2,4}/gi;
    return expUrl.test(strUrl);
}

function handleStateChange() {
    if (xhr.readyState == 4) {
        if (xhr.status == 200) {
            parse(xhr.responseText);
            //alert("성공 : "+xhr.responseText);
        }
        else {
            alert("실패 : " + xhr.status);
        }
    }
}

function getURLDom(targetURL) {

    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = handleStateChange;
    xhr.open('GET', targetURL, true);
    //xhr.setRequestHeader("content-Type","application/json;charset=utf-8");
    //xhr.send(JSON.stringify(msg));
    xhr.send();

}

function renderURL(url) {
    document.getElementById("#in_url").value = "Johnny Bravo";
}


document.addEventListener('DOMContentLoaded', function () {

    var naver = document.getElementById('naver');
    var facebook = document.getElementById('facebook');
    var in_url = document.getElementById("in_url");
    var search = document.getElementById('submit_url');
/*
    show_btn = 'naver';
    naver.addEventListener('click', function () {
        show_btn = 'naver';
        alert('n')
    })
    facebook.addEventListener('click', function () {
        show_btn = 'facebook'
        alert('f')
    })
*/
    search.addEventListener('click', function () {
        url = in_url.value;

        var expUrl = /^(https?):\/\/([a-z0-9-]+\.)+[a-z0-9]{2,4}.*$/
        if (!expUrl.test(url)) {
            url = 'https://' + url;
        }
        //url 재검색
        document.querySelector('#rect_box').style.display = "none";
        document.querySelector('#square_box').style.display = "none";


        var c = document.getElementById('rect_img').childElementCount;
        if(c==0){
            var c = document.getElementById('square_img').childElementCount;
            if(c!=0){//정사각형 이미지 존재 
                var list = document.getElementById("square_img");
                list.removeChild(list.childNodes[0]);
            }
        }else{//직사각형 이미지 존재
            var list = document.getElementById("rect_img");
            list.removeChild(list.childNodes[0]);
        }
        getURLDom(url);
    })

    getCurrentTabUrl(function (url) {
        getURLDom(url);
        in_url.value = url;
    });
});
