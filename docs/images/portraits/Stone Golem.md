> [!infobox|right wikipedia]+
> # Golem
> ![[Golem.jpg|cover hsmall]]
> ###### Stats
> | Biography |
> | ---- | ---- |
> | Type | Monster |
> | Race | Golem |
> | Job | N/A |


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
- Found in [[Y1 Spring Week 04]] and was broken, need 10 segments to repair
- Spent 5 segments in [[Y1 Spring Week 04]] repairing
- Spent 5 segments in [[Y1 Spring Week 05]] repairing, now fully fixed
