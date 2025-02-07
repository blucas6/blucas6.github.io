import requests
import os
from datetime import datetime
import base64

# projects in this list will not be added to the repo.js file
PROJECTS_TO_EXCLUDE = [
    'blucas6.github.io'
]

FILE_TO_UPDATE = 'repo.js'
USER = 'blucas6'
# { <reponame>: { 'desc': <desc>,
#                 'last_update': <date>,
#                 'html_url': <url?>,
#                 'release_url': <url?> 
#               },
#   <reponame>: {...},
# }
REPO_DICT = {}

def sendRequest(request: str):
    '''
    Sends a <request> and returns the object
    '''
    print('---- URL ---------------')
    print(request)
    print('------------------------')

    return requests.get(request)

def getAllRepos(user: str):
    '''
    Returns a list of all repos under a <user> from Github
    '''
    print('[Get Repos from User]')
    repo_url = f'https://api.github.com/users/{user}/repos'
    res = sendRequest(repo_url)

    if res.status_code == 200:
        reposjson = res.json()
        return [repo['name'] for repo in reposjson if not repo['name'] in PROJECTS_TO_EXCLUDE]
    elif res.status_code == 403:
        print('Github rate limit!')
    else:
        print(f'Failed to get repos: {res.status_code}\n{res.reason}')
    return []

def getRepoInfo(user: str, repo_list: list):
    '''
    Takes a <user> and their <repo_list> and pings Github for the 
    rest of the info for that repo
    '''
    print('[Get info per repo]')
    # Go through repo list
    for repo in repo_list:
        url = f'https://api.github.com/repos/{user}/{repo}'
        res = sendRequest(url)
        if res.status_code == 200:
            rjson = res.json()
            release_download = None
            # check if repo contains a release url
            if rjson['releases_url']:
                url = rjson['releases_url'].replace('{/id}','')
                release_res = sendRequest(url)
                if release_res.status_code == 200:
                    release_json = release_res.json()
                    if len(release_json) > 0:
                        release_download = release_json[0]['assets'][0]['browser_download_url']
            # check for readme
            readme_url = f'https://api.github.com/repos/{user}/{repo}/readme'
            readme_res = sendRequest(readme_url)
            tags = None
            if readme_res.status_code == 200:
                readme64 = readme_res.json()['content']
                readme = base64.b64decode(readme64).decode('utf-8')
                lines = readme.split('\n')
                tags = [lines[i+1].split(',')
                        for i,line in enumerate(lines) if line == '## Tags']
                if tags:
                    tags = [t.strip() for t in tags[0]]
                print(tags)
            REPO_DICT[repo] = {
                'desc': rjson['description'],
                'updated_at': rjson['updated_at'],
                'html_url': rjson['html_url'],
                'release_url': release_download,
                'tags': tags
            }
        elif res.status_code == 403:
            print('GitHub rate limit reached!')
        else:
            print(f'Failed ({res.status_code})')
def writeToJS():
    '''
    Writes the REPO_DICT to the JS file
    '''
    print('[Write to file]')
    counter = 0
    if REPO_DICT:
        with open(FILE_TO_UPDATE, 'w+') as jsf:
            jsf.write('export const repoDictionary = {\n')
            for repo, info in REPO_DICT.items():
                jsf.write('\trepo'+str(counter)+': {\n')
                jsf.write(f"\t\trepo: '{repo}',\n")
                jsf.write(f"\t\tdesc: '{info['desc']}',\n")
                date = datetime.strptime(info['updated_at'], 
                                '%Y-%m-%dT%H:%M:%SZ').strftime('%Y-%m-%d')
                jsf.write(f"\t\tupdated_at: '{date}',\n")
                jsf.write(f"\t\thtml_url: '{info['html_url']}',\n")
                if info['release_url'] == None:
                    jsf.write('\t\trelease_url: null,\n')
                else:
                    jsf.write(f"\t\trelease_url: '{info['release_url']}',\n")
                if info['tags'] == None or not info['tags']:
                    jsf.write('\t\ttags: null\n')
                else:
                    jsf.write(f"\t\ttags: {info['tags']}\n")
                jsf.write('\t},\n')
                counter += 1
            jsf.write('}\n')
        print('[Done]')
    else:
        print('[Failed: Nothing to write]')

if __name__ == '__main__':
    repolist = getAllRepos(USER)
    getRepoInfo(USER, repolist)
    writeToJS()
