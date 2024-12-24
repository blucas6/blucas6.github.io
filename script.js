const user = 'blucas6';
const getRepos = `https://api.github.com/users/${user}/repos`;
const projectArea = 'board_area';
const boxClassName = 'box';
var savedDivs = [];
const github_auth = {}

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
            addProjectDiv(reponame, data['description'], data['updated_at']);
        }

        for (let d of savedDivs)
        {
            console.log(d.textContent);
        }
        // organize list of divs
        savedDivs.sort((a, b) => {
            const dateA = new Date(a.querySelector('.last_update').textContent.trim());
            const dateB = new Date(b.querySelector('.last_update').textContent.trim());
            return dateB - dateA;
        });

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
function addProjectDiv(repo, desc, updated_at)
{
    const newDiv = document.createElement('div');
    const header = document.createElement('h4');
    const description = document.createElement('p');
    const update = document.createElement('p');
    
    header.textContent = repo;
    description.textContent = desc;
    var date = new Date(updated_at);
    update.textContent = `${date.toDateString()}`;
    update.className = 'last_update';

    newDiv.appendChild(header);
    newDiv.appendChild(description);
    newDiv.appendChild(update);

    newDiv.className = boxClassName;
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
    // append all saved content
    for (let repoDiv of savedDivs)
    {
        projectDiv.appendChild(repoDiv);
    }
}

// Execute on load
window.onload = async function() {

    // get the area to populate with github info
    // exit if there is no div to place info
    var projectDiv = document.getElementById(projectArea);

    // make sure we have the div
    if (!projectDiv)
    {
        console.log(`No such thing as ${projectArea}`);
    }
    else
    {
        var res = await loadGitHubContent(projectDiv);

        // check for github limit reached
        if (res === 403)
        {
            // TODO: save project info in session storage in case of 403
            console.log('Github limit error, nothing saved...');
            // display an the github error
            githubLimitError(projectDiv);
        }
        // an actual error has occurred
        else if (res === -1)
        {
            projectDiv.textContent = 'An error has occurred...';
        }
        else
        {
            console.log(res);
        }
    }
};