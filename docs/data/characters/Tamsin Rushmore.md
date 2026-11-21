> [!infobox|right wikipedia]+
> # Tamsin Rushmore
> ![[Tamsin Rushmore.jpg|cover hsmall]]
> ###### Stats
> | Biography |
> | ---- | ---- |
> | Type | Villager |
> | Race | Human |
> | Job | Baker |


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
- Co-owns [[The Hearth Loaf]] with her father, [[Edmund Rushmore]]
- Daughter of [[Edmund Rushmore]]
