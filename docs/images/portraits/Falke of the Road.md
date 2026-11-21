> [!infobox|right wikipedia]+
> # Falke of the Road
> ![[Falke of the Road.jpg|cover hsmall]]
> ###### Stats
> | Biography |
> | ---- | ---- |
> | Type | Adventurer |
> | Race | Human |
> | Job | Bard |


## Visits

```dataview
LIST
FROM [[]] AND "Sessions"
SORT file.name ASC
```

## Cures

```dataview
TABLE WITHOUT ID file.link AS Session, L.ailment AS Ailment, L.outcome AS Outcome
FLATTEN file.lists AS L
WHERE L.npc AND contains(string(L.npc), this.file.name)
SORT file.name ASC
```

## Notes
- 
