const user = 'blucas6';
const getRepos = `https://api.github.com/users/${user}/repos`;
const projectArea = 'board_area';
const boxClassName = 'box';

var savedDivs = [];

// Go through a users github and add each project to the website
// ----------------------------------------
// projectDiv: where the content info should be placed
async function loadGitHubContent(projectDiv)
{
    // try to load content from github
    try
    {
        // fetch the repos for the username
        var ans = await fetch(getRepos);
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
            var response = await fetch(url);
            
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
            addProjectDiv(projectDiv, reponame, data['description']);
        }
    } catch (error) {
        console.log(error);
        return error;
    }
    return 0;
}

// Add a project from github to the website
// Saves divs in case github can't be reached
// -----------------------------------------
// projectDiv: the div to add all projects to
// repo: the name of the repository for the project
// desc: a description of the project
function addProjectDiv(projectDiv, repo, desc)
{
    const newDiv = document.createElement('div');
    const header = document.createElement('h4');
    const description = document.createElement('p');
    
    header.textContent = repo;
    description.textContent = desc;

    newDiv.appendChild(header);
    newDiv.appendChild(description);

    newDiv.className = boxClassName;
    projectDiv.appendChild(newDiv);
    
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

// Execute on load
window.onload = async function() {
    // get the area to populate with github info
    // exit if there is no div to place info
    var projectDiv = document.getElementById(projectArea);
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
            // check for saved content
            if (savedDivs.length > 0)
            {
                // append all saved content
                for (let repoDiv of savedDivs)
                {
                    projectDiv.appendChild(repoDiv);
                }
            }
            else
            {
                console.log('Github limit error, nothing saved...');
                // display an the github error
                githubLimitError(projectDiv);
            }
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