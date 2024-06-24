This is a project I use as a submodule for some of my multi-lingual static sites.

Please run this in the command line for the project:

```
npm run init
git submodule update --init --recursive
```

Once you're ready to start trying the site run this:

```
npm run watch
```

If you're using VSCode or Cursor, run the command "open with live server".

---

# Deployments:

- To deploy, you may have to update the .gitmodules file. Since it is a private repository, a personal token is needed. Change the url to:
  https://<your_personal_access_token>@github.com/benwmaddox/GlobalSitesCore.git

If more details are needed, please reach out to ben@maddoxlabs.com
