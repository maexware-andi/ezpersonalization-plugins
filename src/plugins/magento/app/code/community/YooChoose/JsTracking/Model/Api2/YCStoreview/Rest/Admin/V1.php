<?php

class YooChoose_JsTracking_Model_Api2_YCStoreView_Rest_Admin_V1 extends YooChoose_JsTracking_Model_Api2_YCStoreView
{
    protected function getStoreRelations()
    {
        $result = array();
        $stores = Mage::app()->getStores();
        
        foreach ($stores as $store) {
            $tmp = $store->toArray();
            Mage::app()->setCurrentStore($store['store_id']);
            $result[] = array(
                'id' => $store['store_id'],
                'name' => $store['name'],
                'item_type_id' => Mage::getStoreConfig('yoochoose/general/itemtypeid'),
                'languange' => Mage::getStoreConfig('yoochoose/general/language'),
            );
        }
        
        return $result;
    }
    
    /**
     * Retrieve list of customers.
     *
     * @return array
     */
    protected function _retrieveCollection()
    {
        return $this->getStoreRelations();
    }

}
