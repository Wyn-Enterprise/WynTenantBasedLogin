var username = "", wynUrl = "", token = "", docDictionary = [], selectedDocument = null, selectedOrg = null;

//Login
function btnLogin_click() {
    wynUrl = document.getElementById("wynUrl").value;
    var re = /\/$/;
    wynUrl = wynUrl.replace(re, "");
    username = document.getElementById("username").value;
    var pswd = document.getElementById("pswd").value;

    if (username === '' || pswd === '') {
        alert("Username and/or Password cannot be empty. Please fill all the fields...!!!!!!");
        return false;
    }
    else {
        $.ajax({
            type: 'POST',
            url: wynUrl + '/connect/token',
            data: {
                "grant_type": "password",
                "username": username,
                "password": pswd,
                "client_id": "integration",
                "client_secret": "eunGKas3Pqd6FMwx9eUpdS7xmz"
            },
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded',
            headers: { accept: 'application/json' },
        }).then(function (result, textStatus, xhr) {
            if (xhr.status === 200) {                
                document.cookie = "username=" + username;
                document.cookie = "wynurl=" + wynUrl;
                document.getElementById("org-root").classList.remove('not-displayed');

                getOrganizationObjList(wynUrl, result.access_token).then((items) => {
                    const elementDropdown = document.getElementById('org-dropdown');
                    const optionsElement = elementDropdown.querySelector('.org-dropdown-options');
                    const titleElement = elementDropdown.querySelector('.org-dropdown-title');
                    const defaultText = '...';
                    titleElement.addEventListener('click', () => {
                        const optionsClasses = optionsElement.classList;
                        if (optionsClasses.contains('not-displayed')) {
                            optionsClasses.remove('not-displayed');
                            titleElement.classList.add('focused');
                        }
                        else {
                            optionsClasses.add('not-displayed');
                            titleElement.classList.remove('focused');
                        }
                    });
                    optionsElement.addEventListener('click', selectOrg);
                    optionsElement.innerHTML = '';                    
                    if (items) {
                        items.forEach((itemObject) => {
                            const item = document.createElement('li');
                            item.setAttribute('data-value', itemObject.path);
                            item.innerHTML = itemObject.name;
                            optionsElement.append(item);
                        });
                        titleElement.textContent = items[0].name;
                    }
                }).catch((err) => alert(err));

            }
            else if (xhr.status === 401) {
                console.log(xhr.error);                
            }
            //return null;
        }).fail(function (err) {
            //return {};
            console.log(err);
        });
        return true;
    }
}

function btnOk_click() {
    if (selectedOrg == null) {
        alert('Please select an Organization');
        return;
    }

    var pswd = document.getElementById("pswd").value;

    $.ajax({
        type: 'POST',
        url: wynUrl + '/connect/token',
        data: {
            "grant_type": "password",
            "username": username,
            "password": pswd,
            "client_id": "integration",
            "client_secret": "eunGKas3Pqd6FMwx9eUpdS7xmz",
            "tenant_path": selectedOrg
        },
        dataType: 'json',
        contentType: 'application/x-www-form-urlencoded',
        headers: { accept: 'application/json' },
    }).then(function (result, textStatus, xhr) {
        if (xhr.status === 200) {
            document.cookie = "accessToken=" + result.access_token;
            window.location = "./WynPortal.html";
        }
    }).fail(function (err) {
        //return {};
        console.log(err);
    });;
}

function selectOrg(e) {
    const item = e.target;
    const elementDropdown = document.getElementById('org-dropdown');
    const optionsElement = elementDropdown.querySelector('.org-dropdown-options');
    const titleElement = elementDropdown.querySelector('.org-dropdown-title');

    optionsElement.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
    item.classList.add('selected');
    optionsElement.classList.add('not-displayed');
    titleElement.classList.remove('focused');

    selectedOrg = item.dataset.value;
    titleElement.textContent = item.textContent;

    document.getElementById('org-select-button').focus();
}

function concatUrls(...urls) {
    const skipNullOrEmpty = (value) => !!value;
    const trimLeft = (value, char) => (value.substr(0, 1) === char ? value.substr(1) : value);
    const trimRight = (value, char) => (value.substr(value.length - 1) === char ? value.substr(0, value.length - 1) : value);
    return urls
        .map(x => x && x.trim())
        .filter(skipNullOrEmpty)
        .map((x, i) => (i > 0 ? trimLeft(x, '/') : x))
        .map((x, i, arr) => (i < arr.length - 1 ? trimRight(x, '/') : x))
        .join('/');
};

const defaultHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Accept: 'application/json',
    'content-type': 'application/json',
    'pragma': 'no-cache',
};

const makeHeaders = (referenceToken) => ({ ...defaultHeaders, 'Reference-Token': referenceToken });

async function performGetRequest(portalUrl, url, referenceToken) {
    const response = await fetch(concatUrls(portalUrl, url),
        { headers: makeHeaders(referenceToken) });
    if (!response.ok) throw new Error(`${url} status code ${response.status}`);
    const responseJson = await response.json();
    return responseJson;
};

async function getOrganizationObjList(portalUrl, referenceToken) {
    const url = 'admin/api/accountmanagement/api/v1/users/organizations';
    const result = await performGetRequest(portalUrl, url, referenceToken);
    return result;
}

//Load Wyn Portal Page
function loadWynPortal() {
    token = readCookie("accessToken");
    username = readCookie("username");
    wynUrl = readCookie("wynurl");

    $("#userLabel").text("Welcome " + username);
    var wyniFrame = document.getElementById("wynframe");
    wyniFrame.src = wynUrl + "?token=" + token;   
}

//Document List Click
function wynlist_click(e) {
    var target = e.target;
    if (e.target.classList.contains("active")) {
        e.target.classList.remove("active");
        selectedDocument = null;
    }
    else {
        let elements = document.getElementById('wynList').children;
        for (let i = 0; i < elements.length; ++i) {
            elements[i].classList.remove("active");
        }
        e.target.classList.add("active");
        var docName = target.innerText;
        selectedDocument = docDictionary.find(x => x.Name === docName);
    }
}

//Logout
function btnLogout_click() {
    document.cookie = "accessToken=\"\"";
    document.cookie = "username=\"\"";
    document.cookie = "wynurl=\"\"";

    var wyniFrame = document.getElementById("wynframe");
    wyniFrame.src = "";

    window.location = "./Index.html";
}

function getDefaultHeaders(enableCache) {

    var headers = {
        Accept: 'application/json',
    };
    if (token) {
        headers['Reference-Token'] = token;
    }
    return headers;
}

function getValue(obj, path) {
    if (!obj) return null;
    var pathParts = path.split('.');
    var value = obj;

    for (var i = 0; i < pathParts.length; i++) {
        value = value[pathParts[i]];
        if (!value) return null;
    }
    return value;
}

function graphqlRequest(query) {
    return $.ajax({
        url: wynUrl + '/api/graphql?token=' + token,
        type: 'POST',
        data: JSON.stringify({
            query: query,
        }),
        dataType: 'json',
        contentType: 'application/json',
        processData: true,
        headers: getDefaultHeaders(),
        xhrFields: {
            withCredentials: true,
        }
    });
}

function extend(baseOptions, additionalOptions) {
    return $.extend({}, baseOptions || {}, additionalOptions || {});
}

function readCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}