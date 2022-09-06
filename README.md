# cached-hook

example (using recoil lib)


```js

const { data: submissions =[], isLoading } =  useFetch({
    fetcher: () => getSubmissions(classCode, activeModule),
    selector: projectSubmissionsSelector,
    key: `submission-${classCode}-${activeModule}`,
    isMultiple: true,
    dependency: [classCode, activeModule],
    expiresIn:10000, // 10seconds
  })

```
