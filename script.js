import { repoDictionary } from "./repo.js";

// Icons
const github_icon = 'fab fa-github';
const download_icon = 'fas fa-solid fa-download';

const user = 'blucas6';
const getRepos = `https://api.github.com/users/${user}/repos`;
const projectArea = 'board_area';
const boxClassName = 'box';
const repoClassName = 'repoClass';
const repoHeader = 'repoHeader';
var savedDivs = [];
const github_auth = {};

// Add to this list when adding a gif
const gif_repos = [
    'tkinter-image-viewer',
    'caesar-cipher',
    'risk_ai',
    'BudgetBuddy',
    'DataSetInvestigator'
];

var orderByDescending = false;

// Go through a users github and add each project to the website
// ----------------------------------------
// projectDiv: where the content info should be placed
async function loadGitHubContent(projectDiv)
{
    // try to load content from github
    try
    {
        // fetch the repos for the username
        var ans = await fetch(getRepos, github_auth);
        if (ans.status === 403)
        {
            return 403;
        }
        else if (!ans.ok)
        {
            return ans.statusText;
        }

        // decode answer if query works
        var repos = await ans.json();

        // loop through all repos
        for (let i=1; i<repos.length; i++)
        {
            // fetch info for a repo
            var reponame = repos[i]['name'];
            var url = `https://api.github.com/repos/${user}/${reponame}`;
            var response = await fetch(url, github_auth);
            
            // check for errors
            if (response.status === 403)
            {
                return 403;
            }
            if (!response.ok)
            {
                return response.statusText;
            }
            
            // decode json and add div to site
            var data = await response.json();
            console.log(data);
            var release_url = '';
            if (data['releases_url'])
            {
                var url = data['releases_url'].replace("{\/id}", "");
                var res = await fetch(url, github_auth);
                if (res.status === 403)
                {
                    return 403;
                }
                if (!response.ok)
                {
                    return response.statusText;
                }
                var release = await res.json();
                console.log(release);
                if (release.length > 0)
                {
                    release_url = release[0]['assets'][0]['browser_download_url'];
                }                
            }
            addProjectDiv(reponame, data['description'], data['updated_at'], data['html_url'], release_url);
        }

        sortRepos();

        // append all of them to the website
        appendAllSavedRepos(projectDiv);
    } catch (error) {
        console.log(error);
        return error;
    }
    return 0;
}

// Add a project from github to a list
// Saves divs in case github can't be reached
// -----------------------------------------
// repo: the name of the repository for the project
// desc: a description of the project
// updated_at: last updated date
// html_url: the url to the git repo
// release_url: downloadable release url from github
function addProjectDiv(repo, desc, updated_at, html_url, release_url)
{
    const newDiv = document.createElement('div');
    const header = document.createElement('div');
    const headername = document.createElement('h4');
    const description = document.createElement('p');
    const update = document.createElement('p');
    const link = document.createElement('a');
    const download = document.createElement('a');
    
    // header
    headername.className = 'repo_headername';
    headername.textContent = repo;
    header.appendChild(headername);
    link.className = `neu_button github_link ${github_icon}`;
    link.href = html_url;
    link.target = "_blank";
    header.appendChild(link);
    if (release_url)
    {
        download.className = `neu_button github_release ${download_icon}`;
        download.href = release_url;
        header.appendChild(download);
    }
    header.className = repoHeader;
    newDiv.appendChild(header);

    // body
    // gif
    if (gif_repos.includes(repo))
    {
        // add gif
        const gif = document.createElement('img');
        gif.src = `projects/${repo}/example.gif`;
        gif.alt = 'preview gif';
        newDiv.appendChild(gif);
    }
    description.textContent = desc;
    var date = new Date(updated_at);
    update.textContent = `${date.toDateString()}`;
    update.className = 'last_update';

    newDiv.appendChild(description);
    newDiv.appendChild(update);

    // finish div
    newDiv.className = `${boxClassName} ${repoClassName}`;
    savedDivs.push(newDiv);
}

// Displays an error when github is unreachable
// -----------------------------------
// projectDiv: the div to add all projects to
function githubLimitError(projectDiv)
{
    const newDiv = document.createElement('div');
    newDiv.textContent = 'Github limit reached...';
    projectDiv.appendChild(newDiv);
}

// Appends all div repos from the savedlist to the site
// ------------------------------------
// projectDiv: the div to add all projects to
function appendAllSavedRepos(projectDiv)
{
    projectDiv.innerHTML = ''
    // append all saved content
    for (let repoDiv of savedDivs)
    {
        projectDiv.appendChild(repoDiv);
    }
}

// Action call for the sorting button
function reOrderRepos()
{
    var projectDiv = document.getElementById(projectArea);
    sortRepos();
    var sortbutton = document.getElementById('sortbutton');
    if (orderByDescending)
    {
        sortbutton.innerHTML = "<i class='fas fa-angle-down' style='font-size:24px'></i>";
        sortbutton.className = 'neu_button_pressed';
    }
    else
    {
        sortbutton.innerHTML = "<i class='fas fa-angle-up' style='font-size:24px'></i>";
        sortbutton.className = 'neu_button';
    }
    orderByDescending = !orderByDescending;
    // make sure we have the div
    if (!projectDiv)
    {
        console.log(`No such thing as ${projectArea}`);
        return;
    }
    appendAllSavedRepos(projectDiv);
}

// Flip which way the projects are ordered (last update)
function sortRepos()
{
    // organize list of divs
    savedDivs.sort((a, b) => {
        const dateA = new Date(a.querySelector('.last_update').textContent.trim());
        const dateB = new Date(b.querySelector('.last_update').textContent.trim());
        if (orderByDescending)
        {
            return dateA - dateB;
        }
        else
        {
            return dateB - dateA;
        }
    });
}

// Reads from a <repoDictionary> and adds the projects to
// the <projectDiv> area
// -------------------------------------------------
// projectDiv: div to add all projects to
// repoDictionary: dictionary of all repos and their info
function loadProjects(projectDiv, repoDictionary)
{
    for (const repo in repoDictionary)
    {
        const repoInfo = repoDictionary[repo]
        addProjectDiv(
            repoInfo['repo'],
            repoInfo['desc'], 
            repoInfo['updated_at'],
            repoInfo['html_url'], 
            repoInfo['release_url']
        )
    }
    sortRepos()
    appendAllSavedRepos(projectDiv)
}

// Execute on load
window.onload = async function() {

    // get the area to populate with github info
    // exit if there is no div to place info
    var projectDiv = document.getElementById(projectArea);

    // loading gif
    const gif = document.createElement('img');
    gif.src = `loading-gif.gif`;
    gif.alt = 'loading gif';
    projectDiv.appendChild(gif);

    // make sure we have the div
    if (!projectDiv)
    {
        console.log(`No such thing as ${projectArea}`);
    }
    else
    {
        loadProjects(projectDiv, repoDictionary);
        // var res = await loadGitHubContent(projectDiv);

        // // check for github limit reached
        // if (res === 403)
        // {
        //     projectDiv.innerHTML = ''
        //     // TODO: save project info in session storage in case of 403
        //     console.log('Github limit error, nothing saved...');
        //     // display an the github error
        //     githubLimitError(projectDiv);
        // }
        // // an actual error has occurred
        // else if (res === -1)
        // {
        //     projectDiv.textContent = 'An error has occurred...';
        // }
        // else
        // {
        //     console.log(res);
        // }
    }
};