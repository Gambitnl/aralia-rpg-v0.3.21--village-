---
id: "spell_effects_rules"
title: "Spell Effects (Targets, Saves, Attacks)"
category: "Spellcasting Mechanics"
tags: ["rules", "spellcasting", "spell effect", "target", "saving throw", "attack roll", "area of effect"]
excerpt: "Details how spell effects are determined, including targeting rules (clear path, self, AoE), saving throws, attack rolls, and combining spell effects."
aliases: ["spell targeting", "spell saving throws", "spell attack rolls"]
seeAlso: ["spells_chapter", "saving_throw", "attack_roll", "area_of_effect", "total_cover"]
filePath: "/data/glossary/entries/rules/spells/spell_effects_rules.md"
---
# Spell Effects (Targets, Saves, Attacks)

The effects of a spell are detailed after its duration entry. Those details present exactly what the spell does, which ignores mundane physical laws; any outcomes beyond those effects are under the DM’s purview. Whatever the effects, they typically deal with targets, saving throws, attack rolls, or all three, each of which is detailed below.

<details class="feature-card" markdown="1">
  <summary><h3>Targets</h3></summary>
  <div>
    <p>A typical spell requires the caster to pick one or more targets to be affected by the spell’s magic. A spell’s description says whether the spell targets creatures, objects, or something else.</p>
    <ul class="list-disc ml-5 space-y-1 text-gray-300 text-sm">
        <li><strong>A Clear Path to the Target.</strong> To target something with a spell, a caster must have a clear path to it, so it can’t be behind <span data-term-id="total_cover" class="glossary-term-link-from-markdown">Total Cover</span>.</li>
        <li><strong>Targeting Yourself.</strong> If a spell targets a creature of your choice, you can choose yourself unless the creature must be <span data-term-id="hostile_attitude" class="glossary-term-link-from-markdown">Hostile</span> or specifically a creature other than you.</li>
        <li><strong>Areas of Effect.</strong> Some spells, such as <span data-term-id="thunderwave" class="glossary-term-link-from-markdown">Thunderwave</span>, cover an area called an <span data-term-id="area_of_effect" class="glossary-term-link-from-markdown">Area of Effect</span>. The area determines what the spell targets. The description of a spell specifies whether it has an area of effect, which is typically one of these shapes: <span data-term-id="cone_area" class="glossary-term-link-from-markdown">Cone</span>, <span data-term-id="cube_area" class="glossary-term-link-from-markdown">Cube</span>, <span data-term-id="cylinder_area" class="glossary-term-link-from-markdown">Cylinder</span>, <span data-term-id="emanation_area" class="glossary-term-link-from-markdown">Emanation</span>, <span data-term-id="line_area" class="glossary-term-link-from-markdown">Line</span>, or <span data-term-id="sphere_area" class="glossary-term-link-from-markdown">Sphere</span>.</li>
        <li><strong>Awareness of Being Targeted.</strong> Unless a spell has a perceptible effect, a creature doesn’t know it was targeted by the spell. An effect like lightning is obvious, but a more subtle effect, such as an attempt to read thoughts, goes unnoticed unless a spell’s description says otherwise.</li>
        <li><strong>Invalid Targets.</strong> If you cast a spell on someone or something that can’t be affected by it, nothing happens to that target, but if you used a <span data-term-id="spell_slot" class="glossary-term-link-from-markdown">spell slot</span> to cast the spell, the slot is still expended. If the spell normally has no effect on a target that succeeds on a saving throw, the invalid target appears to have succeeded on its saving throw, even though it didn’t attempt one (giving no hint that the creature is an invalid target). Otherwise, you perceive that the spell did nothing to the target.</li>
    </ul>
  </div>
</details>

<details class="feature-card" markdown="1">
  <summary><h3>Saving Throws</h3></summary>
  <div>
    <p>Many spells specify that a target makes a <span data-term-id="saving_throw" class="glossary-term-link-from-markdown">saving throw</span> to avoid some or all of a spell’s effects. The spell specifies the ability that the target uses for the save and what happens on a success or failure. Here’s how to calculate the DC for your spells:</p>
    <p><strong>Spell save DC</strong> = 8 + your spellcasting ability modifier + your <span data-term-id="proficiency_bonus" class="glossary-term-link-from-markdown">Proficiency Bonus</span></p>
  </div>
</details>

<details class="feature-card" markdown="1">
  <summary><h3>Attack Rolls</h3></summary>
  <div>
    <p>Some spells require the caster to make an <span data-term-id="attack_roll" class="glossary-term-link-from-markdown">attack roll</span> to determine whether the spell hits a target. Here’s how to calculate the attack modifier for your spells:</p>
    <p><strong>Spell attack modifier</strong> = your spellcasting ability modifier + your <span data-term-id="proficiency_bonus" class="glossary-term-link-from-markdown">Proficiency Bonus</span></p>
  </div>
</details>

<details class="feature-card" markdown="1">
  <summary><h3>Combining Spell Effects</h3></summary>
  <div>
    <p>The effects of different spells add together while their durations overlap. In contrast, the effects of the same spell cast multiple times don’t combine. Instead, the most potent effect—such as the highest bonus—from those castings applies while their durations overlap. The most recent effect applies if the castings are equally potent and their durations overlap. For example, if two Clerics cast <span data-term-id="bless" class="glossary-term-link-from-markdown">Bless</span> on the same target, that target gains the spell’s benefit only once; the target doesn’t receive two bonus dice. But if the durations of the spells overlap, the effect continues until the duration of the second <em>Bless</em> ends.</p>
  </div>
</details>

<div class="glossary-callout" markdown="1">
    <h4>Identifying an Ongoing Spell</h4>
    <p>You can try to identify a non-instantaneous spell by its observable effects if its duration is ongoing. To identify it, you must take the <span data-term-id="study_action" class="glossary-term-link-from-markdown">Study action</span> and succeed on a DC 15 Intelligence (<span data-term-id="arcana" class="glossary-term-link-from-markdown">Arcana</span>) check.</p>
</div>