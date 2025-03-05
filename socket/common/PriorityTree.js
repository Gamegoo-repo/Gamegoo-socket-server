class TreeNode {
  constructor(matchingUuid, priorityValue) {
    this.matchingUuid = matchingUuid;
    this.priorityValue = priorityValue;
    this.left = null;
    this.right = null;
  }
}

// BST 구현
class PriorityTree {
  constructor() {
    this.root = null;
  }

  // 새로운 노드를 트리에 삽입
  insert(matchingUuid, priorityValue) {

    const newNode = new TreeNode(matchingUuid, priorityValue);
    if (this.root === null) {
      this.root = newNode;
    } else {
      this.insertNode(this.root, newNode);
    }
  }

  // Node 삽입 로직
  insertNode(node, newNode) {
    if (newNode.priorityValue < node.priorityValue) {
      if (node.left === null) {
        node.left = newNode;
      } else {
        this.insertNode(node.left, newNode);
      }
    } else if (newNode.priorityValue > node.priorityValue) {
      if (node.right === null) {
        node.right = newNode;
      } else {
        this.insertNode(node.right, newNode);
      }
    } else {
      // priorityValue가 같은 경우 matchingUuid로 비교
      if (newNode.matchingUuid < node.matchingUuid) {
        if (node.left === null) {
          node.left = newNode;
        } else {
          this.insertNode(node.left, newNode);
        }
      } else if (newNode.matchingUuid > node.matchingUuid) {
        if (node.right === null) {
          node.right = newNode;
        } else {
          this.insertNode(node.right, newNode);
        }
      }
    }
  }

  // 트리 내 가장 priority가 높은 Node 찾기
  getMax(node) {
    if (node === null) {
      return null;
    }

    if (node.right !== null) {
      node = this.getMax(node.right);
    }
    return node;
  }

  // 트리 내에서 ExceptNode의 우선순위 값보다 작지만 가장 priority가 큰 노드 찾기
  getMaxBeforeNode(node, ExceptNode) {
    if (node === null) {
      return null;
    }
    // 오른쪽이 비어있지 않거나, Exception 노드가 아니라면 한번 더 가기
    if (node.right !== null || node !== ExceptNode) {
      node = this.getMax(node.right);
    }
    return node;
  }


  // 중위 순회로 정렬된 리스트를 반환
  inOrderTraverse(node, result = []) {
    if (node !== null) {
      this.inOrderTraverse(node.left, result);
      result.push({ matchingUuid: node.matchingUuid, priorityValue: node.priorityValue });
      this.inOrderTraverse(node.right, result);
    }
    return result;
  }

  // 트리의 정렬된 리스트를 반환
  getSortedList() {
    return this.inOrderTraverse(this.root);
  }

  // 특정 matchingUuid가 트리에 존재하는지 확인
  contains(matchingUuid) {
    return this.inOrderContains(this.root, matchingUuid);
  }
  
  getNode(matchingUuid) {
    return this.findNode(this.root, matchingUuid);
  }

  // 내부적으로 DFS로 순회하며 matchingUuid가 일치하는 노드를 탐색
  findNode(node, matchingUuid) {
    if (node === null) {
      return null;
    }

    if (node.matchingUuid === matchingUuid) {
      return node;
    }

    // 왼쪽 서브트리에서 먼저 찾기
    const leftSearch = this.findNode(node.left, matchingUuid);
    if (leftSearch) {
      return leftSearch;
    }

    // 왼쪽 서브트리에서 못 찾았으면 오른쪽 서브트리에서 찾기
    return this.findNode(node.right, matchingUuid);
  }

  // 중위 순회로 특정 matchingUuid가 있는지 확인하는 메서드
  inOrderContains(node, matchingUuid) {
    if (node === null) {
      return false; // 노드가 없으면 false 반환
    }

    // 왼쪽 자식 노드 탐색
    if (this.inOrderContains(node.left, matchingUuid)) {
      return true;
    }

    // 현재 노드가 찾는 matchingUuid인지 확인
    if (node.matchingUuid === matchingUuid) {
      return true;
    }

    // 오른쪽 자식 노드 탐색
    return this.inOrderContains(node.right, matchingUuid);
  }

  // 트리를 완전히 비우는 메서드
  clear() {
    this.root = null;
  }

  // 특정 matchingUuid를 갖는 노드를 삭제
  removeBymatchingUuid(matchingUuid) {
    const { node, parent } = this.findNodeAndParent(this.root, null, matchingUuid);
    if (!node) {
      return null; // 노드를 찾지 못하면 null 반환
    }
    this.removeNode(node, parent);
  }

  // 노드와 부모 노드를 찾는 메서드
  findNodeAndParent(node, parent, matchingUuid) {
    if (node === null) {
      return { node: null, parent: null };
    }
    if (node.matchingUuid === matchingUuid) {
      return { node, parent };
    }
    if (node.left) {
      const leftResult = this.findNodeAndParent(node.left, node, matchingUuid);
      if (leftResult.node) return leftResult;
    }
    if (node.right) {
      const rightResult = this.findNodeAndParent(node.right, node, matchingUuid);
      if (rightResult.node) return rightResult;
    }
    return { node: null, parent: null };
  }

  // 노드를 삭제하는 메서드
  removeNode(node, parent) {
    if (node.left === null && node.right === null) { // 리프 노드인 경우
      if (node === this.root) {
        this.root = null;
      } else if (parent.left === node) {
        parent.left = null;
      } else {
        parent.right = null;
      }
    } else if (node.left === null || node.right === null) { // 자식이 하나인 경우
      const child = node.left || node.right;
      if (node === this.root) {
        this.root = child;
      } else if (parent.left === node) {
        parent.left = child;
      } else {
        parent.right = child;
      }
    } else { // 자식이 둘인 경우
      const successor = this.findMinNode(node.right);
      const successormatchingUuid = successor.matchingUuid;
      const successorPriorityValue = successor.priorityValue;
      this.removeBymatchingUuid(successor.matchingUuid); // 후속 노드 삭제
      node.matchingUuid = successormatchingUuid;
      node.priorityValue = successorPriorityValue;
    }
  }

  // 트리 내에서 가장 작은 값을 갖는 노드 찾기
  findMinNode(node) {
    if (node.left === null) {
      return node;
    } else {
      return this.findMinNode(node.left);
    }
  }

}

// PriorityTree.js
module.exports = {
  PriorityTree
};
