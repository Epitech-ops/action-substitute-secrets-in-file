# Substitute values into Tokenised File

Substitute GitHub values into a File, matching on a specified Token format.

Assume we have a source-controlled file `config.json` like so:

```json
{
    "ConnectionString": "#[CONNECTIONSTRING]",
    "Preferences": {
        "SomeFixedValue": "Always the same",
        "Currency": "${PREFERENCES_CURRENCY}"
    },
    ...
}
```

We want to manage `CONNECTIONSTRING` and `PREFERENCES_CURRENCY` (and potentially a hundred more configuration values) via GitHub Variables, Secrets and custom items with matching names.  
We do not want to list them out manually in all of our Workflow YAML files and evaluate a series of `${{ secrets.NAME }}` expressions whenever we want to use them. Instead, we want to bulk-replace them succinctly.  
With this GitHub Action, we can do that.

**GitHub Secrets**

```
CONNECTIONSTRING = Data Source=123.456.789.123,1433;Initial Catalog=MyDB;User ID=MyUser;Password=MyPassword;

... etc
```

**GitHub Variables**

```
PREFERENCES_CURRENCY = Bitcoin

... etc
```


**Workflow YAML**

```yaml
- name: Substitute Secrets
  uses: epitech-ops/action-substitute-secrets-in-file@v1.0.0
  with:

    # The (single) file to target.
    file: config.json

    # The (single) file output.
    # Optional - defaults to same as ":"file"
    output: config.json

    # The tokens patterns.
    tokenPatterns: |
      {
        "VARIABLE": "${VARIABLE}",
        "SECRET": "#[SECRET]"
      }

    # Passes GitHub Secrets as a JSON string to the action.
    # This MUST be supplied.
    valuesJson: |
      {
        "VARIABLE": ${{ toJSON(vars) }},
        "SECRET": ${{ toJSON(secrets) }}
      }
```

The Action will replace all occurrences of `${VARIABLE}` and `#[SECRET]` (where VARIABLE and SECRET is any GitHub Variable/Secret name) with the associated Variable/Secret value. After execution, our `config.json` will look like:

```json
{
    "ConnectionString": "Data Source=123.456.789.123,1433;Initial Catalog=MyDB;User ID=MyUser;Password=MyPassword;",
    "Preferences": {
        "SomeFixedValue": "Always the same",
        "Currency": "Bitcoin"
    },
    ...
}
```

## Notes

### File Formats

The file format needn't be JSON. It can be anything. The Action will simply look inside any nominated file for any string that matches the token format and attempt to substitute it with the corresponding GitHub Secret value.

### Missing values

Tokens in a file without any matching value will be listed in a warning during execution.

### Output

The `output` input (🤔) is optional. By default, the Action will replace the file in-place. If an `output` is specified, the original file will not be modified and instead the substitution will be outputted to a file at the specified path.