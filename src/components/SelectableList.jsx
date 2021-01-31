import React, { useState, useEffect } from 'react'

function SelectableList({className, id, isEnabled, aggregateSelection, 
    onItemChange=(index, event)=>{}}) {

    const [itemState, setItemState] = useState([])

    useEffect(() => {
        setItemState(children.map((_)=>false))
    }, [])

    useEffect(() => {
        if (aggregateSelection === true || aggregateSelection === false) {
            const newState = []
            children.forEach((_, index)=>{
                newState[index] = aggregateSelection
            })
            setItemState(newState)
        }
    }, [aggregateSelection])

    handleOnItemChange = (index, event)=>{
        const newItemState = [...itemState]
        newItemState[index] = !itemState[index]
        setItemState(newItemState)
        onItemChange(index, event)
    }

    return (
        <div className={className} id={id}>
            <ul className="selectable-list">
                { children.forEach((view, index)=>{
                    <li className="item" key={view.key}>
                        { isEnabled && 
                        <div className="selectable">
                            <input type="checkbox" 
                                checked={itemState[index]}
                                onChange={(e)=>handleOnItemChange(index, e)}
                            />
                        </div>
                        }
                        { view }
                    </li>
                })}
            </ul>
        </div>
    )
}

export default SelectableList
